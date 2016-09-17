# Splix.io protocol

## Servers
Servers are located by json file http://splix.io/json/servers.json

| Packet name | Data type | Name in game              | Description
|:-----------:|-----------|---------------------------|------------
| 1           |           | UPDATE_BLOCKS             |
| 2           |           | PLAYER_POS                | Contains the position of any player within view
| 3           |           | FILL_AREA                 |
| 4           |           | SET_TRAIL                 |
| 5           |           | PLAYER_DIE                | Contains information on when a player within view dies
| 6           |           | CHUNK_OF_BLOCKS           |
| 7           |           | REMOVE_PLAYER             | Remove a player from view
| 8           |           | PLAYER_NAME               | Contains name of a specified player
| 9           |           | MY_SCORE                  | Contains your own score
| 10          |           | MY_RANK                   | Contains your own rank
| 11          |           | LEADERBOARD               | Contains every single leaderboard value
| 12          |           | MAP_SIZE                  | Defines the width and height of the map
| 13          |           | YOU_DED                   | Sent when you died
| 14          |           | MINIMAP                   | Contains every single minimap block to be rendered
| 15          |           | PLAYER_SKIN               | Contains skin of a specific player
| 16          |           | EMPTY_TRAIL_WITH_LAST_POS |
| 17          |           | READY                     | Sent when the server validates player spawn
| 18          |           | PLAYER_HIT_LINE           |
| 19          |           | REFRESH_AFTER_DIE         |
| 20          |           | PLAYER_HONK               | Sent when a player within view honks
| 21          |           | PONG                      | Sent when a player ping the server

### Packet 1

### Packet 2

### Packet 3

### Packet 4

### Packet 5

### Packet 6

### Packet 7

### Packet 8

### Packet 9

### Packet 10

### Packet 11

### Packet 12

### Packet 13

### Packet 14

### Packet 15

### Packet 16

### Packet 17

### Packet 18

### Packet 19

### Packet 20

### Packet 21

## Client

All messages are send as Uint8Array

| Packet name | Data type | Name in game     | Description
|:-----------:|-----------|----------------- | ------------
| 1           |           | UPDATE_DIR       | Update direction
| 2           |           | SET_USERNAME     | Set username
| 3           |           | SKIN             | Set skin
| 4           |           | READY            | Sent after username and skin packet are send to initiate player spawn
| 5           |           | REQUEST_CLOSE    |
| 6           |           | HONK             | Send honk (honk is when you press space / hold down for a bigger honk size)
| 7           |           | PING             | Ping server
| 8           |           | REQUEST_MY_TRAIL | Request for your trail (the path drawn when not in native territory)

### Packet 1

### Packet 2

### Packet 3

### Packet 4

### Packet 5

### Packet 6

### Packet 7

### Packet 8
