var redis = require("redis"),
    client = redis.createClient();

for(var i=0; i< 10; i++) {
  client.get(i, function(err, resp) {
    client.set(i,'[]')
  })
}
/*client.set(5, JSON.stringify(numbers), redis.print);
client.set("key2", JSON.stringify(numbers.reverse()), redis.print);

client.mget(["key1","key2"], function(err,resp) { 
  var gotten_numbers = JSON.parse(resp[1])
  console.log(gotten_numbers)
  
  //console.log("error: ", err); console.log("resp: ", resp);
})
*/
