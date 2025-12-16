-- KEYS[1] = stock key
-- KEYS[2] = user lock key
-- KEYS[3] = info key

-- ARGV[1] = now_ts
-- ARGV[2] = lock_ttl_seconds
-- ARGV[3] = qty

local stock = tonumber(redis.call("GET", KEYS[1]) or "-1")
if stock <= 0 then
  return -4 -- OUT_OF_STOCK
end

local info = redis.call("GET", KEYS[3])
if not info then
  return -6 -- NO_INFO
end

local data = cjson.decode(info)
local now = tonumber(ARGV[1])
local start = tonumber(data.startTime)
local finish = tonumber(data.endTime)

if now < start then
  return -1 -- NOT_STARTED
end
if now > finish then
  return -2 -- ENDED
end

if redis.call("SETNX", KEYS[2], 1) == 0 then
  return -3 -- USER_SPAM
end

redis.call("EXPIRE", KEYS[2], tonumber(ARGV[2]))

local qty = tonumber(ARGV[3])
if stock < qty then
  redis.call("DEL", KEYS[2])
  return -4 -- OUT_OF_STOCK
end

redis.call("DECRBY", KEYS[1], qty)
return 1
