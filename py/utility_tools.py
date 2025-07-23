from datetime import datetime
from zoneinfo import ZoneInfo  # Python 内置模块
from tzlocal import get_localzone

# 获取本地时区（tzinfo 类型）
local_timezone = get_localzone()  # 这个返回的是 tzinfo 类型

async def time_async(timezone: str = None):
    # 如果没有传入 timezone，则使用本地时区
    tz = ZoneInfo(timezone) if timezone else local_timezone
    
    # 获取当前时间（带时区信息）
    now = datetime.now(tz=tz)
    
    # 格式化输出
    time_message = f"当前时间：{now.strftime('%Y-%m-%d %H:%M:%S')}，时区：{tz}"
    return time_message

time_tool = {
    "type": "function",
    "function": {
        "name": "time_async",
        "description": f"获取当前时间（带时区信息）",
        "parameters": {
            "type": "object",
            "properties": {
                "timezone": {
                    "type": "string",
                    "description": "当前时区，默认为本地时区，格式为：Asia/Shanghai",
                },
            },
            "required": [],
        },
    },
}