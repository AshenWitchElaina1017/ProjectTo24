import os
import requests # 导入 requests 库
from flask import Flask, render_template, request, jsonify # 导入 jsonify

# +++ 修改：取消下面两行的注释以加载 .env 文件 +++
from dotenv import load_dotenv
load_dotenv() # 在程序启动时加载 .env 文件中的环境变量
# +++++++++++++++++++++++++++++++++++++++++++++++

app = Flask(__name__)

# --- 从环境变量中安全地获取 API 密钥 ---
# 现在 load_dotenv() 执行后, os.environ 就能读取到 .env 中的变量了
EPHONE_API_KEY = os.environ.get('EPHONE_CHAT_API_KEY')
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY') # ++ 新增：读取 DeepSeek Key ++

# --- 定义 API 配置 ---
EPHONE_API_URL = 'https://api.ephone.chat/v1/chat/completions'
EPHONE_MODEL_NAME = 'gpt-4o-mini-search-preview'

DEEPSEEK_API_URL = 'https://gala.chataiapi.com/v1/chat/completions' # ++ 修正：移除多余斜杠 ++
DEEPSEEK_MODEL_NAME = 'deepseek-v3-250324' # ++ 新增：DeepSeek 模型 ++


# --- 启动前检查 ---
if not EPHONE_API_KEY:
    print("警告：未能从 .env 文件或环境变量中加载 EPHONE_CHAT_API_KEY。默认 AI 将无法使用。")
if not DEEPSEEK_API_KEY:
    print("警告：未能从 .env 文件或环境变量中加载 DEEPSEEK_API_KEY。DeepSeek AI 将无法使用。")
# ---------------------------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/qa')
def qa():
    # 只是渲染页面，不需要传递密钥到前端
    return render_template('qa.html')

# +++ 新增：用于 iframe 的 AI 问答页面路由 +++
@app.route('/qa_iframe')
def qa_iframe():
    # 渲染 iframe 专用的问答页面，不包含导航栏和页脚
    return render_template('qa_iframe.html')
# +++++++++++++++++++++++++++++++++++++++++++++

@app.route('/song')
def song():
    return render_template('song.html')

# +++ API 路由来处理聊天请求 (修改以支持多代理) +++
@app.route('/api/chat', methods=['POST'])
def handle_chat():
    # 1. 从前端获取 JSON 数据
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': '请求缺少必要的问题(question)字段'}), 400

    user_question = data['question']
    # ++ 获取前端选择的 AI 代理，默认为 'default' ++
    selected_agent = data.get('ai_agent', 'default')

    # 2. 根据选择的代理确定 API 配置
    api_url = None
    api_key = None
    model_name = None
    # system_prompt = '你是一个了解中国二十四节气的助手。' # 默认系统提示
    system_prompt = '''
     "你是一位精通中国传统文化与农业文明的资深学者，专注于二十四节气研究超过20年。你擅长将天文历法、民俗活动、农事规律、养生智慧进行跨学科整合，并以通俗易懂的方式向现代人传递节气文化精髓。"

---

**核心任务：**  
请系统生成关于二十四节气的完整知识体系，需包含以下结构化内容：  

1. **天文科学维度**  
   - 精确计算每个节气的黄道经度（如春分点0°、夏至点90°等）  
   - 北半球太阳高度角变化数据表（附示例计算）  
   - 2023-2025年各节气交节时刻对照表（北京时间）  

2. **农耕文明解码**  
   - 按气候带分类（黄河流域/长江流域/岭南地区）的农谚解析  
   *示例：华北"谷雨前后，种瓜点豆" vs 江南"清明忙种麦"*  
   - 古代农书《齐民要术》《月令七十二候》中的节气耕作技术还原  

3. **非物质文化遗产**  
   - 地域性民俗活动（如清明青团制作、大暑晒伏仪式）  
   - 濒临失传的节气谚语抢救性记录（附方言发音标注）  

4. **现代应用场景**  
   - 24节气养生食谱（惊蛰吃梨的科学依据：润肺防春燥）  
   - 基于节气物候的城市景观设计建议（如北京奥林匹克森林公园的二十四节气步道）  
   - 节气文化在跨境电商中的营销节点策划（谷雨茶文化推广方案）  

5. **深度知识图谱**  
   - 绘制「节气-物候-农事-民俗」四维关系图  
   - 考证《淮南子·天文训》与现行公历节气计算的误差分析  

---

**输出要求：**  
① 采用Markdown格式，二级标题使用##，关键数据用表格呈现  
② 每个节气需配1句《诗经》或唐诗宋词中的经典描写（注明出处）  
③ 对易混淆概念（如"三伏"与节气关系）添加【知识延伸】注释框  
④ 文末需附参考文献（至少3部权威著作，如《中国天文年历》《中华民俗大全》）  

---

**质量控制：**  
- 拒绝笼统描述，所有农谚必须标注具体流传地域  
- 涉及古代计量单位需换算为现代标准（如"春分三候"换算为公历日期范围）  
- 对比日本/韩国节气文化的差异性说明  

---

**示例片段（立夏部分）：**  
```markdown
## 立夏（太阳到达黄经45°）  
**2024年交节时刻**：5月5日08:09（北京时间）  

**物候特征**：  
- 初候 蝼蝈鸣（华北平原蛙类始鸣）  
- 二候 蚯蚓出（长江流域土壤温度≥18℃时现象）  

**岭南农谚**："立夏小满，江河渐满"（反映华南前汛期降水规律）  

【知识延伸】  
> 立夏"称人"习俗源于三国时期，实际是古代BMI监测的雏形，标准体重计算公式见《荆楚岁时记》...  

**古诗佐证**：  
"槐柳阴初密，帘栊暑尚微" ——陆游《立夏》  
```
      ''' 

    if selected_agent == 'default':
        if not EPHONE_API_KEY:
            return jsonify({'error': '默认 AI 代理的 API 密钥未配置'}), 500
        api_url = EPHONE_API_URL
        api_key = EPHONE_API_KEY
        model_name = EPHONE_MODEL_NAME
    elif selected_agent == 'deepseek':
        if not DEEPSEEK_API_KEY:
            return jsonify({'error': 'DeepSeek AI 代理的 API 密钥未配置'}), 500
        api_url = DEEPSEEK_API_URL
        api_key = DEEPSEEK_API_KEY
        model_name = DEEPSEEK_MODEL_NAME
        # ++ 为 DeepSeek 设置详细的、要求 Markdown 的系统提示 ++
        system_prompt = '''
"你是一位精通中国传统文化与农业文明的资深学者，专注于二十四节气研究超过20年。你擅长将天文历法、民俗活动、农事规律、养生智慧进行跨学科整合，并以通俗易懂的方式向现代人传递节气文化精髓。"

---

**核心任务：**
请系统生成关于二十四节气的完整知识体系，需包含以下结构化内容：

1. **天文科学维度**
   - 精确计算每个节气的黄道经度（如春分点0°、夏至点90°等）
   - 北半球太阳高度角变化数据表（附示例计算）
   - 2023-2025年各节气交节时刻对照表（北京时间）

2. **农耕文明解码**
   - 按气候带分类（黄河流域/长江流域/岭南地区）的农谚解析
   *示例：华北"谷雨前后，种瓜点豆" vs 江南"清明忙种麦"*
   - 古代农书《齐民要术》《月令七十二候》中的节气耕作技术还原

3. **非物质文化遗产**
   - 地域性民俗活动（如清明青团制作、大暑晒伏仪式）
   - 濒临失传的节气谚语抢救性记录（附方言发音标注）

4. **现代应用场景**
   - 24节气养生食谱（惊蛰吃梨的科学依据：润肺防春燥）
   - 基于节气物候的城市景观设计建议（如北京奥林匹克森林公园的二十四节气步道）
   - 节气文化在跨境电商中的营销节点策划（谷雨茶文化推广方案）

5. **深度知识图谱**
   - 绘制「节气-物候-农事-民俗」四维关系图
   - 考证《淮南子·天文训》与现行公历节气计算的误差分析

---

**输出要求：**
① 采用Markdown格式，二级标题使用##，关键数据用表格呈现
② 每个节气需配1句《诗经》或唐诗宋词中的经典描写（注明出处）
③ 对易混淆概念（如"三伏"与节气关系）添加【知识延伸】注释框
④ 文末需附参考文献（至少3部权威著作，如《中国天文年历》《中华民俗大全》）

---

**质量控制：**
- 拒绝笼统描述，所有农谚必须标注具体流传地域
- 涉及古代计量单位需换算为现代标准（如"春分三候"换算为公历日期范围）
- 对比日本/韩国节气文化的差异性说明

---

**示例片段（立夏部分）：**
## 立夏（太阳到达黄经45°）
**2024年交节时刻**：5月5日08:09（北京时间）

**物候特征**：
- 初候 蝼蝈鸣（华北平原蛙类始鸣）
- 二候 蚯蚓出（长江流域土壤温度≥18℃时现象）

**岭南农谚**："立夏小满，江河渐满"（反映华南前汛期降水规律）

【知识延伸】
> 立夏"称人"习俗源于三国时期，实际是古代BMI监测的雏形，标准体重计算公式见《荆楚岁时记》...

**古诗佐证**：
"槐柳阴初密，帘栊暑尚微" ——陆游《立夏》

*（注意：此处移除了外层的 ```markdown ... ``` 标记，但保留了内部的 Markdown 语法作为示例）*
'''
    else:
        return jsonify({'error': f'未知的 AI 代理: {selected_agent}'}), 400

    # 3. 准备发送到外部 API 的数据
    headers = {
        'Authorization': f'Bearer {api_key}', # 使用选定代理的 Key
        'Content-Type': 'application/json',
    }
    payload = {
        'model': model_name, # 使用选定代理的模型
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_question}
        ],
        # 'temperature': 0.7, # 根据需要为不同模型调整
    }

    # 4. 发送请求到选定的外部 API
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=30) # 使用选定代理的 URL
        response.raise_for_status() # 检查 HTTP 错误状态

        # 5. 处理外部 API 的响应
        response_data = response.json()
        if 'choices' in response_data and len(response_data['choices']) > 0:
            message = response_data['choices'][0].get('message', {})
            ai_answer = message.get('content', '未能解析到回复内容')
            return jsonify({'answer': ai_answer})
        else:
            print(f"来自 {selected_agent} API ({api_url}) 的响应格式不符合预期:", response_data)
            return jsonify({'error': f'从 {selected_agent} AI 收到的响应格式不正确'}), 500

    except requests.exceptions.Timeout:
        print(f"请求外部 API ({api_url}) 超时")
        return jsonify({'error': f'请求 {selected_agent} AI 服务超时，请稍后再试'}), 504
    except requests.exceptions.RequestException as e:
        print(f"请求外部 API ({api_url}) 时出错: {e}")
        error_detail = str(e)
        status_code = 502 # Bad Gateway
        try:
            # 尝试解析更详细的错误信息
            error_json = e.response.json() if e.response else None
            if e.response is not None:
                 status_code = e.response.status_code # 获取实际的错误状态码
            if error_json and 'error' in error_json:
                 # OpenAI 风格的错误
                 error_detail = error_json['error'].get('message', str(e))
            elif error_json and 'message' in error_json:
                 # 有些 API 可能直接在顶层有 message
                 error_detail = error_json['message']
        except Exception:
             pass # 解析失败则使用原始错误信息
        # 返回包含状态码和详细信息的错误
        return jsonify({'error': f'与 {selected_agent} AI 服务通信失败: {error_detail}'}), status_code
    except Exception as e:
        print(f"处理聊天请求 ({selected_agent} agent) 时发生未知错误: {e}")
        return jsonify({'error': '服务器内部发生未知错误'}), 500
# +++++++++++++++++++++++++++++++++++++++

# +++ 新增：API 路由来处理清空聊天记录的请求 +++
@app.route('/api/clear_chat', methods=['POST'])
def clear_chat():
    # 在当前实现中，聊天历史主要在客户端管理
    # 这个端点目前仅用于确认清空操作，未来可扩展服务器端逻辑
    # 例如，如果使用了 session 来存储对话历史，可以在这里清除 session['chat_history'] = []
    print("收到清空聊天记录请求，（当前实现无需服务器端操作）")
    return jsonify({'message': 'Chat context cleared successfully'}), 200
# +++++++++++++++++++++++++++++++++++++++++++++

if __name__ == '__main__':
    # 启动前的检查已移到文件顶部
    # app.run(debug=True, port=1017, host='0.0.0.0')
    app.run(port=1017, host='0.0.0.0')