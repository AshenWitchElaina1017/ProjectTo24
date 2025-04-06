# 二十四节气 Web 应用

这是一个基于 Flask 的 Web 应用程序，旨在以互动和信息化的方式介绍中国的二十四节气。

## 功能特性

*   **首页 (`/`)**: 项目的入口页面。
*   **节气翻牌游戏 (`/game`)**: 一个简单的记忆匹配游戏，使用二十四节气的图片。
*   **AI 问答 (`/qa`)**: 用户可以就二十四节气相关问题提问，后端通过调用外部 AI 服务（支持 ChatGPT 和 DeepSeek）来提供答案。
*   **节气歌曲 (`/song`)**: 可能包含与二十四节气相关的歌曲或音乐信息。

## 创新点

*   **文化与科技融合**: 将中国传统文化精髓（二十四节气）与现代 Web 技术（Flask）及人工智能（多模型 AI 问答）相结合。
*   **互动式学习**: 通过翻牌游戏等互动元素，提升用户对节气知识的学习兴趣和记忆效果。
*   **多 AI 模型集成**: 集成了 ChatGPT 和 DeepSeek 两个 AI 模型，为用户提供多样化的信息来源和问答体验。
*   **深度内容生成**: 利用精心设计的系统提示（System Prompt），引导 AI 生成结构化、深入、准确的节气知识体系。

## 应用点

*   **教育与科普**: 可作为学习和了解中国传统文化、二十四节气知识的在线教育平台或科普工具。
*   **文化遗产数字化**: 探索将传统文化内容通过现代技术进行展示和传播的新途径。
*   **技术演示**: 展示如何在 Web 应用中集成和应用大型语言模型（LLM）处理特定领域（如传统文化）的问答任务。
*   **二次开发基础**: 可作为进一步开发的基础，例如增加更多节气相关的互动模块、引入地域性差异、结合农事建议或养生食谱等。

## 技术栈

*   **后端**: Python, Flask
*   **前端**: HTML, CSS, JavaScript
*   **API 调用**: `requests` 库
*   **环境变量管理**: `python-dotenv`
*   **部署 (可选)**: `gunicorn` (列在 requirements.txt 中，通常用于生产环境部署)

## 安装与运行

1.  **克隆仓库**:
    ```bash
    git clone https://github.com/AshenWitchElaina1017/ProjectTo24.git
    cd ProjectTo24
    ```

2.  **创建并激活虚拟环境** (推荐):
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **安装依赖**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **配置 API 密钥**:
    *   复制 `.env.example` (如果存在) 或手动创建一个名为 `.env` 的文件。
    *   在 `.env` 文件中添加您的 API 密钥：
        ```dotenv
        CHATGPT_API_KEY=your_chatgpt_api_key_here
        DEEPSEEK_API_KEY=your_deepseek_api_key_here
        ```
    *   **注意**: 如果没有提供相应的 API 密钥，对应的 AI 问答功能将无法使用。

5.  **运行应用**:
    ```bash
    python app.py
    ```
    应用将在 `http://localhost:1017` (或根据 `app.py` 中的配置) 运行。

## 项目结构

```
.
├── .env                # 环境变量文件 (需要手动创建)
├── app.py              # Flask 应用主文件
├── README.md           # 项目说明文件
├── requirements.txt    # Python 依赖列表
├── static/             # 静态文件 (CSS, JS, Images, Data)
│   ├── css/
│   ├── data/
│   ├── images/
│   └── js/
└── templates/          # HTML 模板文件
    ├── index.html
    ├── game.html
    ├── qa.html
    ├── qa_iframe.html
    └── song.html
