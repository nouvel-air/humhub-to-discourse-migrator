[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# HumHum to Discourse Migrator

This is a very rough migrator, which has been used so far with https://forum.jardiniersdunous.org

Below are some instructions on how to make it work. Use at your own risk ! ;)

## Usage

Copy the `.env` file to `.env.local` and setup your keys and URLs.

In your Discourse instance, go to the Parameters > Rate limits, and remove as many limits as possible.

### Migrate users

If you want to show the user's location, you will need to install the [Location plugin](https://github.com/paviliondev/discourse-locations)

```
call space.freshImport
```

### Migrate group members

Create groups in your Discourse instance.

Edit the `groupsMapping` and `groupsNameMapping` object in the [mappings.js](./mappings.js) file.

```
call space.freshImport
```

### Migrate posts

Create categories in your Discourse instance.

Edit the `categoriesMapping` object in the [mappings.js](./mappings.js) file.

```
call post.freshImport
```

### Migrate events

If you want to use the calendar, you will need to install the official [Calendar plugin](https://github.com/discourse/discourse-calendar)

```
call calendar.freshImport
```

### Migrate wiki pages

```
call wiki.freshImport
```
