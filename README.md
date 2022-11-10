# Telegram bot for notifying about absence

## Getting Started

1. init project

```
npm init
```
2. set up database and configure .env file

## Comments

Project was tested with PostgreSQL, should work with other RDBs.

Used technologies: NodeJS, typescript, grammyJS, KnexJS+pg

## DB setup

Check *tables.sql* for table setup example (PostgreSQL)

## Functionality

- Custom context in order to keep some user info from database in session;

- Additional admin functionality (getting all records from db, toggle for notifications);

- Notification of admins on new record;





