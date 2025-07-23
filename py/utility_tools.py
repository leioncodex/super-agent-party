from datetime import datetime
from zoneinfo import ZoneInfo  # Python 内置模块
from tzlocal import get_localzone
from py.accweatherAPI import AccuWeatherAPI
from py.get_setting import load_settings
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

async def get_weather_async(city: str, forecast: bool = False, days: int = 1):
    """
    查询城市天气（实时或预报）
    
    :param city: 城市名称
    :param forecast: 是否为预报（False为实时天气）
    :param days: 预报天数（1或5）
    :return: 格式化后的天气信息字符串
    """
    try:
        # 每次调用都重新加载API key
        settings = await load_settings()
        api_key = settings["tools"]["accuweather"]["apiKey"]
        weather_api = AccuWeatherAPI(api_key)
        
        # 获取天气数据
        weather_data = weather_api.get_weather(city, forecast=forecast, days=days)
        
        if weather_data["status"] != "success":
            return f"获取天气失败: {weather_data['message']}"
        
        data = weather_data["data"]
        
        # 格式化输出
        if forecast:
            # 预报天气
            headline = data.get("Headline", {})
            daily_forecasts = data.get("DailyForecasts", [])
            
            result = [
                f"{city}的{days}天天气预报:",
                f"概况: {headline.get('Text', '无')}",
                f"严重程度: {headline.get('Severity', '无')}",
                "每日预报:"
            ]
            
            for day in daily_forecasts[:days]:
                date = day.get("Date", "")
                temp = day.get("Temperature", {})
                day_temp = temp.get("Maximum", {}).get("Value", "未知")
                night_temp = temp.get("Minimum", {}).get("Value", "未知")
                day_phrase = day.get("Day", {}).get("IconPhrase", "未知")
                night_phrase = day.get("Night", {}).get("IconPhrase", "未知")
                
                result.append(
                    f"- {date}: 白天{day_temp}°C/{day_phrase}, 夜间{night_temp}°C/{night_phrase}"
                )
            
            return "\n".join(result)
        else:
            # 实时天气
            return (
                f"{city}实时天气:\n"
                f"温度: {data.get('Temperature', {}).get('Metric', {}).get('Value', '未知')}°C\n"
                f"天气状况: {data.get('WeatherText', '未知')}\n"
                f"相对湿度: {data.get('RelativeHumidity', '未知')}%\n"
                f"风速: {data.get('Wind', {}).get('Speed', {}).get('Metric', {}).get('Value', '未知')} km/h"
            )
    except Exception as e:
        return f"查询天气时出错: {str(e)}"

weather_tool = {
    "type": "function",
    "function": {
        "name": "get_weather_async",
        "description": "查询城市天气（实时或预报）",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如：北京、New York",
                },
                "forecast": {
                    "type": "boolean",
                    "description": "是否为天气预报（false为实时天气）",
                    "default": False
                },
                "days": {
                    "type": "integer",
                    "description": "预报天数（1或5）",
                    "default": 1,
                    "enum": [1, 5]
                },
            },
            "required": ["city"],
        },
    },
}

async def get_location_coordinates_async(city: str):
    """
    查询城市的经纬度信息
    
    :param city: 城市名称
    :return: 格式化后的位置信息字符串
    """
    try:
        # 每次调用都重新加载API key
        settings = await load_settings()
        api_key = settings["tools"]["accuweather"]["apiKey"]
        weather_api = AccuWeatherAPI(api_key)
        
        # 获取位置信息
        location_info = weather_api.get_location_info(city)
        
        if not location_info:
            return f"无法找到城市{city}的位置信息"
        
        # 取第一个结果
        loc = location_info[0]
        return (
            f"{city}的位置信息:\n"
            f"名称: {loc.get('name', '未知')} ({loc.get('english_name', '未知')})\n"
            f"国家: {loc.get('country', '未知')}\n"
            f"行政区: {loc.get('administrative_area', '未知')}\n"
            f"经纬度: {loc.get('geo_position', {}).get('latitude', '未知')}, "
            f"{loc.get('geo_position', {}).get('longitude', '未知')}\n"
            f"时区: {loc.get('time_zone', '未知')}"
        )
    except Exception as e:
        return f"查询位置信息时出错: {str(e)}"

location_tool = {
    "type": "function",
    "function": {
        "name": "get_location_coordinates_async",
        "description": "查询城市的经纬度和位置信息",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如：北京、New York",
                },
            },
            "required": ["city"],
        },
    },
}