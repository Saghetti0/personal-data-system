# api

The core of the personal data system. Provides an API for CRUD on notes, feeds, etc.

## Design

Unlike most other reasonably designed CRUD services, this does not talk to a database. It stores everything in memory (though flushes to a file for persistence), and filtering takes `O(n)` time. It will remain fast enough in the ballpark of thousands of notes, and by the time I have more than that, I should probably look into redesigning the system.
