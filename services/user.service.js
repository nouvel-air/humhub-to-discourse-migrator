const HumHubImporterMixin = require("./mixins/humhub");
const ProfileManagerMixin = require("./mixins/profile-manager");
const DiscourseMixin = require("./mixins/discourse");
const CONFIG = require("../config");
const {
  frenchAddressSearch,
  swissAddressSearch,
  mapboxAddressSearch,
} = require("../utils");

const delay = async (t) => new Promise((resolve) => setTimeout(resolve, t));

module.exports = {
  name: "user",
  mixins: [ProfileManagerMixin, HumHubImporterMixin, DiscourseMixin],
  settings: {
    source: {
      humhub: {
        baseUrl: CONFIG.HUMHUB_URL,
        jwtToken: CONFIG.HUMHUB_TOKEN,
        type: "user",
      },
    },
  },
  actions: {
    async cleanAllUsers() {
      const users = await this.fetchDiscourse(`/admin/users/list/new.json`);

      const usersToKeep = ["system", "discobot", "srosset81"];

      for (const user of users) {
        if (!usersToKeep.includes(user.username)) {
          console.log("Deleting user " + user.username);
          const result = await this.fetchDiscourse(
            `/admin/users/${user.id}.json`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                delete_posts: true,
                block_email: false,
                block_urls: false,
                block_ip: false,
              }),
            }
          );
          console.log(result.deleted);
        }
      }
    },
  },
  methods: {
    async migrate(data) {
      if (data.account.username.startsWith("deleted")) {
        this.logger.info(`Ignoring deleted user (${data.account.username})`);
        return;
      }

      const user = await this.fetchDiscourse(
        `/u/${data.account.username}.json`
      );

      const geoLocation = await this.getGeoLocation(data.profile);

      if (user) {
        this.logger.info(
          `User (${data.account.username}) already exist, skipping...`
        );

        if (geoLocation) {
          await this.fetchDiscourse(`/u/${data.account.username}.json`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...user,
              custom_fields: {
                geo_location: geoLocation,
              },
            }),
          });
        } else {
          console.log("No geo location found for ", data);
        }

        return;
      }

      await delay(5000);

      this.logger.info(`Importing (${data.account.username})...`);

      let result = await this.fetchDiscourse("/users.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.display_name,
          email: data.account.email,
          password: "UNUSED986!!UNUSED986",
          username: data.account.username,
          active: true,
          approved: true,
          // See https://meta.discourse.org/t/how-to-change-user-fields-with-api/147999
          // 'user_fields[1]': data.profile.competences,
          // external_ids
          custom_fields: {
            geo_location: geoLocation,
          },
        }),
      });

      if (result.success) {
        const user = await this.fetchDiscourse(
          `/admin/users/${result.user_id}.json`
        );

        const imageUrl = `https://www.jardiniersdunous.org/uploads/profile_image/${data.guid}.jpg`;

        const response = await fetch(imageUrl);
        const blob = await response.blob();

        if (response.status === 200) {
          const formData = new FormData();
          formData.append("type", "avatar");
          formData.append("user_id", user.id);
          formData.append("file", blob, "image.jpg");
          formData.append("synchronous", true);

          const upload = await this.fetchDiscourse("/uploads.json", {
            method: "POST",
            headers: {},
            body: formData,
          });

          const resultAvatar = await this.fetchDiscourse(
            `/u/${user.username}/preferences/avatar/pick.json`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "uploaded",
                upload_id: upload.id,
              }),
            }
          );

          if (!resultAvatar) {
            this.logger.warn(`Could not set avatar for ${user.username}`);
          }
        }
        this.logger.info(`Successfully created user ${data.account.username}`);
      } else {
        this.logger.warn(`Could not post user ${data.account.username}`);
        console.log(result);
      }
    },
    async getGeoLocation({ country, street, zip, city }) {
      const queryArray = [];
      // if (street) queryArray.push(street + ',');
      if (zip) queryArray.push(zip);
      if (city) queryArray.push(city);
      const query = queryArray.join(" ");

      if (country === "FR") {
        let feature;
        /*if (street) {
          const features = await frenchAddressSearch(query);
          feature = features?.find(feat => feat.properties.type === 'street' || feat.properties.type === 'housenumber');
        } else*/ if (city) {
          const features = await frenchAddressSearch(query, "municipality");
          feature = features?.find(
            (feat) => feat.properties.type === "municipality"
          );
        } else if (zip) {
          const features = await frenchAddressSearch(query, "municipality");
          feature = features?.find(
            (feat) => feat.properties.type === "municipality"
          );
        }

        return (
          feature && {
            lon: feature.geometry?.coordinates[0],
            lat: feature.geometry?.coordinates[1],
            // address: feature.properties.label,
            city: feature.properties.city,
            state: feature.properties.context.split(", ")?.slice(-1)?.[0],
            country_code: "fr",
            country: "France",
            postalcode: feature.properties.postcode,
            type: "administrative",
          }
        );
      } else if (country === "CH") {
        const address = await swissAddressSearch(query);

        return (
          address && {
            lon: address.position?.lng,
            lat: address.position?.lat,
            // address: query,
            city: address.cityName,
            state: address.cantonCode,
            country_code: "ch",
            country: "Switzerland",
            postalcode: address.postalCode,
            type: "administrative",
          }
        );
      } else {
        const feature = await mapboxAddressSearch(query);

        const postCode = feature?.context?.find((ctx) =>
          ctx.id.startsWith("postcode.")
        );
        const city = feature?.context?.find((ctx) =>
          ctx.id.startsWith("place.")
        );
        const state = feature?.context?.find((ctx) =>
          ctx.id.startsWith("region.")
        );
        const country = feature?.context?.find((ctx) =>
          ctx.id.startsWith("country.")
        );

        return (
          feature && {
            lon: feature.center?.[0],
            lat: feature.center?.[1],
            // address: feature.place_name,
            postalcode: postCode?.text,
            city: city?.text,
            state: state?.text,
            country_code: country?.short_code,
            country: country?.text,
            type: "administrative",
          }
        );
      }
    },
  },
};
