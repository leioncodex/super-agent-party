import asyncio
from datetime import datetime
import json
from zoneinfo import ZoneInfo  # Python 内置模块
import requests
from tzlocal import get_localzone
from py.accweatherAPI import AccuWeatherAPI
from py.get_setting import load_settings
import wikipediaapi
import arxiv
from typing import Dict, List, Optional
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
                    "description": "预报天数（1或5），注意预报天数为1时，返回的是今天的预测天气，如果要查看明天的天气，请将days设置为5，返回的第一条数据为今天的预测天气，第二条数据为明天的预测天气，以此类推。",
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

async def get_weather_by_city_async(city: str,lang:str="zh-CN",product:str="astro") -> str:
    """
    根据城市名称获取7timer天气数据（JSON + 图片URL）
    
    :param city: 城市名称（如 "北京"、"New York"）
    :return: 格式化的字符串，包含JSON数据和图片URL
    """
    try:
        # 1. 获取城市经纬度
        location_info = await get_location_coordinates_async(city)
        
        # 解析经纬度（假设返回格式包含 "经纬度: 纬度, 经度"）
        if "经纬度:" not in location_info:
            return f"无法获取 {city} 的经纬度信息"
        
        # 提取经纬度（示例解析逻辑，可能需要调整）
        geo_part = location_info.split("经纬度:")[1].split("\n")[0].strip()
        lat, lon = map(float, geo_part.split(","))
        
        # 2. 调用7timer API获取天气数据
        base_url = "http://www.7timer.info/bin/astro.php"
        
        # 获取图片URL
        img_params = {
            "lon": lon,
            "lat": lat,
            "ac": 0,
            "lang": lang,
            "unit": "metric",
            "tzshift": 0,
        }
        img_url = f"{base_url}?{'&'.join([f'{k}={v}' for k, v in img_params.items()])}"
        
        # 获取JSON数据
        data_params = {
            "lon": lon,
            "lat": lat,
            "ac": 0,
            "product": product,
            "lang": "en",
            "unit": "metric",
            "output": "json",
            "tzshift": 0,
        }
        data_response = requests.get(base_url, params=data_params)
        data_response.raise_for_status()
        weather_data = data_response.json()
        
        # 3. 返回格式化结果
        return f"{json.dumps(weather_data, ensure_ascii=False)}\n![image]({img_url})"
    
    except Exception as e:
        return f"获取天气数据时出错: {str(e)}"


timer_weather_tool = {
    "type": "function",
    "function": {
        "name": "get_weather_by_city_async",
        "description": "更加详细的天气信息，包含天气晴雨表图片。根据城市名称获取7timer天气数据（JSON + 图片URL）。请按照![image](image_url)格式返回图片URL",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如：北京、New York",
                },
                "lang": {
                    "type": "string",
                    "description": "语言，如：zh-CN、en-US",
                },
                "product": {
                    "type": "string",
                    "description": "产品类型，默认为astro，可选值：astro、civil，astro时，返回3 天（72 小时） 的逐 3 小时天气预报。civil时，返回7 天的天气预报（每天 2-4 个时间点）",
                    "enum": ["astro", "civil"]
                }
            },
            "required": ["city"],
        },
    },
}



async def get_wikipedia_summary_and_sections(
    topic: str, 
    language: str = "zh"
) -> str:
    """
    获取维基百科上某个主题的摘要和所有章节名称（字符串格式返回）
    
    :param topic: 要查询的主题
    :param language: 语言代码，默认为"zh"(中文)
    :param user_agent: 自定义用户代理
    :return: 包含摘要和章节列表的字符串，若页面不存在则返回错误信息
    """
    wiki_wiki = wikipediaapi.Wikipedia(
        language=language,
        extract_format=wikipediaapi.ExtractFormat.WIKI,
        user_agent="super-agent-party"
    )
    
    page = wiki_wiki.page(topic)
    
    if not page.exists():
        return f"维基百科上找不到关于'{topic}'的页面（语言: {language}）"
    
    result = {
        "标题": page.title,
        "摘要": page.summary,
        "URL": page.fullurl,
        "章节列表": [section.title for section in page.sections]
    }
    
    return json.dumps(result, ensure_ascii=False, indent=2)

wikipedia_summary_tool = {
    "type": "function",
    "function": {
        "name": "get_wikipedia_summary_and_sections",
        "description": "获取维基百科上某个主题的摘要和所有章节名称",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "要查询的主题名称",
                },
                "language": {
                    "type": "string",
                    "description": "语言代码，如zh(中文)、en(英文)",
                    "default": "zh"
                },
            },
            "required": ["topic"],
        },
    },
}

async def get_wikipedia_section_content(
    topic: str, 
    section_title: str, 
    language: str = "zh"
) -> str:
    """
    获取维基百科上某个主题特定章节的详细内容（字符串格式返回）
    
    :param topic: 要查询的主题
    :param section_title: 章节标题
    :param language: 语言代码，默认为"zh"(中文)
    :param user_agent: 自定义用户代理
    :return: 包含章节详细内容的字符串，若页面或章节不存在则返回错误信息
    """
    wiki_wiki = wikipediaapi.Wikipedia(
        language=language,
        extract_format=wikipediaapi.ExtractFormat.WIKI,
        user_agent="super-agent-party"
    )
    
    page = wiki_wiki.page(topic)
    
    if not page.exists():
        return f"维基百科上找不到关于'{topic}'的页面（语言: {language}）"
    
    for section in page.sections:
        if section.title == section_title:
            result = {
                "主题": page.title,
                "章节标题": section.title,
                "内容": section.text,
                "URL": page.fullurl
            }
            return json.dumps(result, ensure_ascii=False, indent=2)
    
    return f"在'{topic}'页面中找不到标题为'{section_title}'的章节"

wikipedia_section_tool = {
    "type": "function",
    "function": {
        "name": "get_wikipedia_section_content",
        "description": "获取维基百科上某个主题特定章节的详细内容，你需要先调用get_wikipedia_summary_and_sections获取章节列表",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "要查询的主题名称",
                },
                "section_title": {
                    "type": "string",
                    "description": "要获取的章节标题",
                },
                "language": {
                    "type": "string",
                    "description": "语言代码，如zh(中文)、en(英文)",
                    "default": "zh"
                }
            },
            "required": ["topic", "section_title"],
        },
    },
}



async def search_arxiv_papers(
    query: str,
    max_results: int = 5,
    sort_by: str = "relevance",
    sort_order: str = "descending",
    return_fields: Optional[List[str]] = None
) -> str:
    """
    搜索arXiv论文并返回结构化结果
    
    :param query: 搜索关键词或查询语句
    :param max_results: 返回的最大结果数 (默认5)
    :param sort_by: 排序方式 ("relevance", "submittedDate", "lastUpdatedDate")
    :param sort_order: 排序顺序 ("ascending" 或 "descending")
    :param return_fields: 指定返回的字段列表
    :return: JSON格式的搜索结果
    """
    # 设置默认返回字段
    default_fields = [
        "title", "authors", "summary", "published", 
        "pdf_url", "doi", "primary_category"
    ]
    return_fields = return_fields or default_fields
    
    # 包装同步操作为异步
    def sync_search():
        search = arxiv.Search(
            query=query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion(sort_by),
            sort_order=arxiv.SortOrder(sort_order)
        )
        return list(search.results())
    
    results = []
    try:
        # 在线程池中执行同步操作
        papers = await asyncio.to_thread(sync_search)
        
        for result in papers:
            paper_info = {
                "title": result.title,
                "authors": [author.name for author in result.authors],
                "summary": result.summary,
                "published": str(result.published),
                "pdf_url": result.pdf_url,
                "doi": result.doi or "",
                "primary_category": result.primary_category,
                "entry_id": result.entry_id
            }
            # 过滤字段
            filtered = {k: v for k, v in paper_info.items() if k in return_fields}
            results.append(filtered)
            
        if not results:
            return json.dumps({"error": f"未找到与'{query}'相关的论文"}, ensure_ascii=False)
            
        return json.dumps({
            "query": query,
            "count": len(results),
            "results": results
        }, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({"error": f"搜索失败: {str(e)}"}, ensure_ascii=False)

arxiv_tool = {
    "type": "function",
    "function": {
        "name": "search_arxiv_papers",
        "description": "搜索arXiv学术论文数据库，获取论文标题、作者、摘要、PDF链接等信息",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索英文的关键词或查询语句，例如:'quantum machine learning'或'ti:transformer AND cat:cs.CL'",
                },
                "max_results": {
                    "type": "integer",
                    "description": "返回结果数量(1-100)",
                    "default": 5
                },
                "sort_by": {
                    "type": "string",
                    "enum": ["relevance", "submittedDate", "lastUpdatedDate"],
                    "description": "排序方式",
                    "default": "relevance"
                },
                "sort_order": {
                    "type": "string",
                    "enum": ["ascending", "descending"],
                    "description": "排序顺序",
                    "default": "descending"
                },
                "return_fields": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "指定返回字段，如['title','authors','pdf_url']",
                }
            },
            "required": ["query"],
        },
    },
}