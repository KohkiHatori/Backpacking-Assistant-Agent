
Table: itinerary_items

| Name            | Format                 | Type   | Description                                      |
|-----------------|------------------------|--------|--------------------------------------------------|
| id              | uuid                   | string | Primary Key                                      |
| trip_id         | uuid                   | string | Foreign Key to trips.id                          |
| day_number      | integer                | number | 1-based day index                                |
| order_index     | integer                | number | 0-based index for ordering items within a day    |
| date            | date                   | string | YYYY-MM-DD                                       |
| start_time      | time without time zone | string | HH:MM:SS                                         |
| end_time        | time without time zone | string | HH:MM:SS                                         |
| title           | text                   | string | Title of the event                               |
| description     | text                   | string | Detailed description                             |
| location        | text                   | string | Name of location                                 |
| geo_coordinates | point                  | string | (lat, long)                                      |
| type            | text                   | string | e.g., 'activity', 'transport', 'accommodation'   |
| cost            | integer                | number | Cost in lowest currency unit (cents)             |
| created_at      | timestamp with time zone| string | Creation timestamp                               |

Table: tasks

| Name            | Format                   | Type    | Description                                      |
|-----------------|--------------------------|---------|--------------------------------------------------|
| id              | uuid                     | string  | Primary Key                                      |
| trip_id         | uuid                     | string  | Foreign Key to trips.id                          |
| title           | text                     | string  | Task title                                       |
| description     | text                     | string  | Task details                                     |
| is_completed    | boolean                  | boolean | Completion status                                |
| due_date        | timestamp with time zone | string  | Due date and time                                |
| category        | text                     | string  | e.g., 'booking', 'packing', 'documents'          |
| priority        | text                     | string  | e.g., 'high', 'medium', 'low'                    |
| created_at      | timestamp with time zone | string  | Creation timestamp                               |

Table: destination_tasks

| Name            | Format                   | Type    | Description                                      |
|-----------------|--------------------------|---------|--------------------------------------------------|
| id              | uuid                     | string  | Primary Key                                      |
| trip_id         | uuid                     | string  | Foreign Key to trips.id                          |
| destination     | text                     | string  | Destination name specific to this task           |
| title           | text                     | string  | Task title                                       |
| description     | text                     | string  | Task details                                     |
| is_completed    | boolean                  | boolean | Completion status                                |
| due_date        | timestamp with time zone | string  | Due date and time                                |
| category        | text                     | string  | e.g., 'booking', 'research'                      |
| priority        | text                     | string  | e.g., 'high', 'medium', 'low'                    |
| created_at      | timestamp with time zone | string  | Creation timestamp                               |

Table: trips

| Name            | Format                   | Type    | Description                                      |
|-----------------|--------------------------|---------|--------------------------------------------------|
| id              | uuid                     | string  | Primary Key                                      |
| user_id         | uuid                     | string  | Foreign Key to users.id                          |
| name            | text                     | string  | Trip Name                                        |
| description     | text                     | string  | Short description                                |
| start_point     | text                     | string  | Starting location                                |
| end_point       | text                     | string  | Ending location (if different)                   |
| start_date      | date                     | string  | YYYY-MM-DD                                       |
| end_date        | date                     | string  | YYYY-MM-DD                                       |
| flexible_dates  | boolean                  | boolean | Flag for flexible dates                          |
| destinations    | text[]                   | array   | Array of destination names                       |
| preferences     | text[]                   | array   | Array of trip preferences/tags                   |
| transportation  | text[]                   | array   | Array of transportation modes                    |
| budget          | integer                  | number  | Budget amount                                    |
| currency        | text                     | string  | Currency code (e.g., 'USD')                      |
| created_at      | timestamp with time zone | string  | Creation timestamp                               |
| updated_at      | timestamp with time zone | string  | Last update timestamp                            |
| adults_count    | integer                  | number  | Number of adults                                 |
| children_count  | integer                  | number  | Number of children                               |
