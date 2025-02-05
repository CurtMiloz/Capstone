# Check if server running
- Run 'ps -ef | grep server'

# Running server
- Run 'source envrc.test' for testing, or 'source envrc.prod' for connecting to robot.
- Run 'npm install'.
- Run 'node server.js'

# API Reference
## GET
##### Request position in line for table.

*${HOST}/placeInLine*

AUTHORIZATION: Bearer token auth, using token generated for table.

RETURNS:
```javascript
int // Position in line.
```


##### Request next order in queue.

*${HOST}/nextOrder*

AUTHORIZATION: Bearer token auth, using token generated and passed to robot.

RETURNS:
```javascript
{
	"table_id": "int",
	"order_id": "int",
	"order": [
		{
			"type": "string",
			"size": "char",
			"quantity": "int"
		}
	]
}
```


##### Verify validity of token generated for robot.

*${HOST}/checkToken*

AUTHORIZATION: Bearer token auth, using token generated and passed to robot.

RETURNS:
```javascript
{
	"valid": "boolean"
}
```


##### Return available types of drinks.

*${HOST}/drinks*

AUTHORIZATION: N/A.

RETURNS:
```javascript
{
	"type_0": "tank_num_0",
	"type_1": "tank_num_1"
}
```


##### Return available sizes of drinks.

*${HOST}/sizes*

AUTHORIZATION: N/A.

RETURNS:
```javascript
// common_name: server_constant
{
	"size_1": "size_0",
	"size_1": "size_1"
}
```


##### Return number of available tanks.

*${HOST}/numOfTanks*

AUTHORIZATION: N/A.

RETURNS:
```javascript
int
```


##### Return map.

*${HOST}/map*

AUTHORIZATION: Basic authorization using original administrator credentials OR Bearer token auth, using token generated and passed to robot.

RETURNS:
```javascript
file
```


##### Return unsigned integer representing error code.

*${HOST}/errors*

AUTHORIZATION: Basic authorization using original administrator credentials.

RETURNS:
```javascript
int
```


##### Return tables that were registered through the map.

*${HOST}/availableTables*

AUTHORIZATION: Basic authorization using original administrator credentials OR Bearer token auth, using token generated for table.

RETURNS:
```javascript
$TABLE_ID_1,TABLE_ID_2,TABLE_ID_3...
```


##### 200 if session is valid, 401 otherwise.

*${HOST}/isValidSess*

AUTHORIZATION: Session cookie generated after logging in admin.

RETURNS:
```javascript
N/A
```



## POST
##### Place an order in queue.

*${HOST}/placeOrder*

AUTHORIZATION: Bearer token auth, using token generated for table.

BODY: 
```javascript
{
	"order": [
		{
			"type": "string", 	// Name of drink.
			"quantity": "int", 	// Quantity of order (default = 1).
			"size": "char" 		// Size of drink (default = 'M').
		}
	]
}
```

RETURNS:
```javascript
{
	"placeInLine": "int",
	"orderData": {
		"table_id": "int",
		"order_id": "int",
		"order": [
			{
				"type": "string",
				"size": "char",
				"quantity": "int"
			}
		]
	}
}
```


##### Generate and send a token to robot.

*${HOST}/genToken*

AUTHORIZATION: N/A.

BODY:
```javascript
N/A
```

RETURNS:
```javascript
N/A
```


##### Change administrator credentials

*${HOST}/updateCreds*

AUTHORIZATION: Basic authorization using original administrator credentials.

BODY:
```javascript
{
	"userName": "string",	// New username
	"password": "string"	// New password
}
```

RETURNS:
```javascript
N/A
```


##### Call robot back to base (not yet implemented).

*${HOST}/returnToBase*

AUTHORIZATION: Basic authorization using original administrator credentials.

BODY:
```javascript
N/A
```

RETURNS:
```javascript
N/A
```


##### Verify administrator credentials and start a session.

*${HOST}/login*

AUTHORIZATION: Basic authorization using original administrator credentials.

BODY:
```javascript
N/A
```

RETURNS:
```javascript
N/A
```


##### End user session.

*${HOST}/logout*

AUTHORIZATION: Session cookie.

BODY:
```javascript
N/A
```

RETURNS:
```javascript
N/A
```


##### Receive error codes from robot.

*${HOST}/errors*

AUTHORIZATION: Bearer token auth, using token generated and passed to robot.

BODY:
```javascript
int // Unsigned integer which in its binary representation, conveys occurring errors
```

RETURNS:
```javascript
N/A
```


##### Create a token for said table to authenticate it in the future.

*${HOST}/table?table_id=${table_id}*

AUTHORIZATION: Basic authorization using original administrator credentials.

BODY:
```javascript
N/A
```

RETURNS:
```javascript
{
	"token": "string",
	"token_type": "string"
}
```


##### Add a type to the types of drinks.

*${HOST}/drinks*

AUTHORIZATION: Basic authorization using original administrator credentials.

BODY:
```javascript
{
	"drink_name": "nozzle_number"
}
```

RETURNS:
```javascript
N/A
```


##### Set map.

*${HOST}/map*

AUTHORIZATION: Basic authorization using original administrator credentials OR Bearer token auth, using token generated and passed to robot.

BODY:
```javascript
file
```

RETURNS:
```javascript
N/A
```


## DELETE
##### Cancel an order.

*${HOST}/cancelOrder*

AUTHORIZATION: Bearer token auth, using token generated for table.

RETURNS:
```javascript
N/A
```


##### Delete a drink type

*${HOST}/drinks?name=${drink_name}*

AUTHORIZATION: Basic authorization using original administrator credentials.

RETURNS:
```javascript
N/A
```
