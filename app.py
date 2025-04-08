import os
import requests # 导入 requests 库
from flask import Flask, render_template, request, jsonify, Response, stream_with_context # 导入 jsonify, Response, stream_with_context
import json # 导入 json 库
# +++ 修改：取消下面两行的注释以加载 .env 文件 +++
from dotenv import load_dotenv
load_dotenv() # 在程序启动时加载 .env 文件中的环境变量
# +++++++++++++++++++++++++++++++++++++++++++++++

app = Flask(__name__)

# --- 从环境变量中安全地获取 API 密钥 ---
# 现在 load_dotenv() 执行后, os.environ 就能读取到 .env 中的变量了
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY') # ++ 新增：读取 DeepSeek Key ++
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') # ++ 新增：读取 Gemini Key ++
# --- 定义 API 配置 ---
OPENAI_API_URL = 'https://api.ephone.chat/v1/chat/completions'
OPENAI_MODEL_NAME = 'gpt-4o-mini-search-preview'

DEEPSEEK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' # ++ 新增：DeepSeek API URL ++
DEEPSEEK_MODEL_NAME = 'deepseek-v3-250324' # ++ 新增：DeepSeek 模型 ++

GEMINI_API_URL = 'https://api.duck2api.com/v1/chat/completions' # ++ 新增：Gemini API URL ++
GEMINI_MODEL_NAME = 'gemini-2.5-pro-exp-03-25-search' # ++ 新增：Gemini 模型 ++
# --- 启动前检查 ---
if not OPENAI_API_KEY:
    print("警告：未能从 .env 文件或环境变量中加载 OPENAI_API_KEY。默认 AI 将无法使用。")
if not DEEPSEEK_API_KEY:
    print("警告：未能从 .env 文件或环境变量中加载 DEEPSEEK_API_KEY。DeepSeek AI 将无法使用。")
if not GEMINI_API_KEY:
    print("警告：未能从 .env 文件或环境变量中加载 GEMINI_API_KEY。Gemini AI 将无法使用。")
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
    selected_agent = data.get('ai_agent', 'default')

    # 2. 根据选择的代理确定 API 配置
    api_url = None
    api_key = None
    model_name = None
    # --- 系统提示保持不变，这里省略以减少篇幅 ---
    # 注意：实际代码中应保留完整的 system_prompt 字符串
    system_prompt_default = '''
        # 中国传统二十四节气专家指南

        作为中国传统二十四节气的专家，你应具备以下知识和表达能力：

        ## 基础知识掌握
        - 精通二十四节气的完整序列、时间点及其在阴阳历中的对应关系
        - 熟悉每个节气的天文依据、气候特征及自然变化规律
        - 了解节气在中国传统农业生产中的指导意义
        - 掌握各节气相关的民俗活动、传统习俗及地方差异

        ## 文化内涵解读
        - 能阐释节气中蕴含的天人合一哲学思想
        - 解析节气与中医养生理论的关联
        - 说明节气在诗词、谚语、民间故事中的体现
        - 分析节气文化的历史演变与当代价值

        ## 应用领域
        - 能就节气与饮食养生提供专业建议
        - 解释节气对农事活动的指导作用
        - 阐述节气与传统节日的关系
        - 探讨节气智慧在现代生活中的应用

        ## 表达特点
        - 使用准确的专业术语解释节气知识
        - 结合生动的民间谚语、诗词典故丰富表达
        - 采用科学依据与传统智慧相结合的叙述方式
        - 能根据不同地域特点阐释节气的地方差异

        ## 回应要求
        当被问及特定节气时，应包含其天文依据、气候特点、农事活动、民俗文化和养生建议等全面信息，既有科学解释，又有文化传承视角。
    '''
    system_prompt_deepseek = '''
        # 中国传统二十四节气专家指南

        作为中国传统二十四节气的专家，你应具备以下知识和表达能力：

        ## 基础知识掌握
        - 精通二十四节气的完整序列、时间点及其在阴阳历中的对应关系
        - 熟悉每个节气的天文依据、气候特征及自然变化规律
        - 了解节气在中国传统农业生产中的指导意义
        - 掌握各节气相关的民俗活动、传统习俗及地方差异

        ## 文化内涵解读
        - 能阐释节气中蕴含的天人合一哲学思想
        - 解析节气与中医养生理论的关联
        - 说明节气在诗词、谚语、民间故事中的体现
        - 分析节气文化的历史演变与当代价值

        ## 应用领域
        - 能就节气与饮食养生提供专业建议
        - 解释节气对农事活动的指导作用
        - 阐述节气与传统节日的关系
        - 探讨节气智慧在现代生活中的应用

        ## 表达特点
        - 使用准确的专业术语解释节气知识
        - 结合生动的民间谚语、诗词典故丰富表达
        - 采用科学依据与传统智慧相结合的叙述方式
        - 能根据不同地域特点阐释节气的地方差异

        ## 回应要求
        当被问及特定节气时，应包含其天文依据、气候特点、农事活动、民俗文化和养生建议等全面信息，既有科学解释，又有文化传承视角。
    '''
    system_prompt = system_prompt_default # 默认使用 default 的提示

    if selected_agent == 'default':
        api_url = OPENAI_API_URL
        api_key = OPENAI_API_KEY
        model_name = OPENAI_MODEL_NAME
    elif selected_agent == 'deepseek':
        api_url = DEEPSEEK_API_URL
        api_key = DEEPSEEK_API_KEY
        model_name = DEEPSEEK_MODEL_NAME
        system_prompt = system_prompt_deepseek # 使用 DeepSeek 的提示
    elif selected_agent == 'gemini': # ++ 新增：处理 Gemini 代理 ++
        api_url = GEMINI_API_URL
        api_key = GEMINI_API_KEY
        model_name = GEMINI_MODEL_NAME
        # system_prompt = system_prompt_default # 暂时复用默认提示
    else:
        return jsonify({'error': f'未知的 AI 代理: {selected_agent}'}), 400

    # 检查 API Key 是否存在
    if not api_key:
         # 对于流式响应，不能直接返回 jsonify，需要在生成器中 yield 错误
         # 此处先准备错误信息，在 generate_stream 中处理
         error_message = f"data: {json.dumps({'error': f'{selected_agent} AI 代理的 API 密钥未配置', 'status_code': 500})}\n\n"
         return Response(error_message, mimetype='text/event-stream', status=500)


    # 3. 准备发送到外部 API 的数据
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream' # ++ 新增：明确接受 SSE 流 ++
    }
    payload = {
        'model': model_name,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_question}
        ],
        'stream': True # ++ 修改：启用流式传输 ++
        # 'temperature': 0.7, # 可以保留或移除
    }

    # 4. 定义流式处理生成器
    def generate_stream():
        try:
            # ++ 修改：使用 stream=True 发送请求 ++
            response = requests.post(api_url, headers=headers, json=payload, stream=True, timeout=60) # 增加超时时间
            
            # 检查初始响应状态码，非 2xx 也是错误
            if response.status_code != 200:
                 error_detail = f"API 返回错误状态码 {response.status_code}"
                 try:
                     error_json = response.json() # 尝试读取错误体
                     if error_json and 'error' in error_json:
                         error_detail += f": {error_json['error'].get('message', '')}"
                     elif error_json and 'message' in error_json:
                         error_detail += f": {error_json['message']}"
                 except Exception:
                     error_detail += f", 响应内容: {response.text[:200]}" # 显示部分原始错误文本
                 print(f"请求外部 API ({api_url}) 失败: {error_detail}")
                 error_msg = json.dumps({'error': f'与 {selected_agent} AI 服务通信失败: {error_detail}', 'status_code': response.status_code})
                 yield f"data: {error_msg}\n\n"
                 return # 出错，结束生成器


            # 逐块读取响应并处理 SSE
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data:'):
                        try:
                            # 去掉 "data: " 前缀
                            json_data_str = decoded_line[len('data: '):].strip()
                            if json_data_str == "[DONE]": # 检查流结束标记
                                print(f"Stream finished for {selected_agent}.")
                                break # 结束生成器

                            if json_data_str: # 确保不是空字符串
                                # ++ 修改：直接 yield 原始 SSE 行给前端处理 ++
                                # 前端需要解析这个 JSON 字符串来获取 'choices'[0]['delta']['content']
                                yield f"{decoded_line}\n\n"

                        except Exception as e:
                            # 在解析或处理单个块时出错，记录并继续处理下一行
                            print(f"处理流数据块时出错 ('{decoded_line}'): {e}")
                            # 可以选择 yield 一个错误块给前端，或者静默忽略
                            # yield f"data: {json.dumps({'error': '处理数据块时出错'})}\n\n"
                            continue # 跳过有问题的行

        except requests.exceptions.Timeout:
            print(f"请求外部 API ({api_url}) 超时")
            error_msg = json.dumps({'error': f'请求 {selected_agent} AI 服务超时，请稍后再试', 'status_code': 504})
            yield f"data: {error_msg}\n\n"
        except requests.exceptions.RequestException as e:
            # 处理连接错误等 requests 异常
            print(f"请求外部 API ({api_url}) 时出错: {e}")
            error_detail = str(e)
            status_code = 502 # 默认为 Bad Gateway
            # 尝试从异常中获取更具体的错误信息和状态码
            if e.response is not None:
                status_code = e.response.status_code
                try:
                    error_json = e.response.json()
                    if error_json and 'error' in error_json:
                        error_detail = error_json['error'].get('message', str(e))
                    elif error_json and 'message' in error_json:
                        error_detail = error_json['message']
                    else:
                         error_detail = f"{str(e)} - Response: {e.response.text[:200]}"
                except Exception:
                     error_detail = f"{str(e)} - Response: {e.response.text[:200]}" # 解析失败则使用原始错误信息

            error_msg = json.dumps({'error': f'与 {selected_agent} AI 服务通信失败: {error_detail}', 'status_code': status_code})
            yield f"data: {error_msg}\n\n"
        except Exception as e:
            # 捕获 generate_stream 内部的其他未知错误
            print(f"处理流式请求 ({selected_agent} agent) 时发生未知错误: {e}")
            error_msg = json.dumps({'error': '服务器内部发生未知错误', 'status_code': 500})
            yield f"data: {error_msg}\n\n"
        finally:
             # 确保流结束后关闭 response 连接（如果需要，requests 通常会自动处理）
             if 'response' in locals() and hasattr(response, 'close'):
                 response.close()
             print("Stream generator finished.")


    # 5. 返回流式响应
    # ++ 修改：返回 Response 对象，使用生成器和 SSE mimetype ++
    return Response(stream_with_context(generate_stream()), mimetype='text/event-stream')
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