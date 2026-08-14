# Database

This folder is reserved for FlareLock's future durable persistence layer.

The current prototype uses encrypted runtime files for private intent and execution state. A production version should move that data into a proper encrypted database with indexing, migrations and recovery.

This folder marks that future boundary without pretending the database layer is implemented today.
