# api

The core of the personal data system. Provides an API for CRUD on notes, feeds, etc.

## Design

Unlike most other reasonably designed CRUD services, this keeps everything in memory (though connects to a database solely for persistence). This means that operations like filtering take `O(n)` time, as there are no indexes. It will remain fast enough in the ballpark of thousands of notes, and by the time I have more than that, I should probably look into redesigning the system.
