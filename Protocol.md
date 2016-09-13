# Splix.io protocol

## Servers
Servers are located by json file http://splix.io/json/servers.json

| Packet name | Data type | Name in game              | Description
|:-----------:|-----------|---------------------------|------------
| 1           |           | UPDATE_BLOCKS             |
| 2           |           | PLAYER_POS                |
| 3           |           | FILL_AREA                 |
| 4           |           | SET_TRAIL                 |
| 5           |           | PLAYER_DIE                |
| 6           |           | CHUNK_OF_BLOCKS           |
| 7           |           | REMOVE_PLAYER             |
| 8           |           | PLAYER_NAME               |
| 9           |           | MY_SCORE                  |
| 10          |           | MY_RANK                   |
| 11          |           | LEADERBOARD               |
| 12          |           | MAP_SIZE                  |
| 13          |           | YOU_DED                   |
| 14          |           | MINIMAP                   |
| 15          |           | PLAYER_SKIN               |
| 16          |           | EMPTY_TRAIL_WITH_LAST_POS |
| 17          |           | READY                     |                     
| 18          |           | PLAYER_HIT_LINE           |
| 19          |           | REFRESH_AFTER_DIE         |
| 20          |           | PLAYER_HONK               |
| 21          |           | PONG                      |

## Client

| Packet name | Data type | Name in game     | Description
|:-----------:|-----------|----------------- | ------------
| 1           |           | UPDATE_DIR       | Update direction
| 2           |           | SET_USERNAME     | Set username
| 3           |           | SKIN             | Set skin
| 4           |           | READY            |
| 5           |           | REQUEST_CLOSE    |
| 6           |           | HONK             |
| 7           |           | PING             | Ping server
| 8           |           | REQUEST_MY_TRAIL |
