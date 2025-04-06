# 二十四节气文化 Web 应用

这是一个基于 Flask 构建的 Web 应用程序，旨在通过互动的方式展示和普及中国二十四节气的文化知识。项目集成了信息展示、互动游戏、AI 问答等功能。

## 功能特性

*   **节气信息展示:** 提供多个页面介绍二十四节气的相关知识。
*   **互动游戏:** (推测) 包含一个与节气主题相关的游戏页面 (`game.html`)。
*   **AI 智能问答:**
    *   用户可以就二十四节气提出问题。
    *   后端集成 EPhone Chat 和 DeepSeek 两个 AI 模型，用户可选择使用。
    *   通过深度定制的系统提示 (System Prompt) 引导 AI 生成高质量、结构化、Markdown 格式的专业回答。
    *   提供嵌入式问答页面 (`qa_iframe.html`)。
*   **音乐体验:** (推测) 包含一个与节气或传统文化相关的歌曲页面 (`song.html`)。

## 创新点

*   **深度垂直领域 AI 应用:** 将 AI 技术应用于深厚的二十四节气文化领域。
*   **结构化知识生成:** 利用 AI 生成高质量、多维度的节气知识内容。
*   **多 AI 代理动态切换:** 支持 ChatGPT 和 DeepSeek，提供灵活性。
*   **文化与科技融合:** 结合传统文化与现代 Web 及 AI 技术。

## 应用场景

*   在线教育与科普平台
*   文化内容创作辅助工具
*   智能信息查询服务
*   文化旅游与活动策划支持
*   数字人文研究与展示

## 技术栈

*   **后端:** Flask (Python)
*   **前端:** HTML, CSS, JavaScript
*   **AI 集成:** EPhone Chat API, DeepSeek API
*   **依赖管理:** (可能使用 requirements.txt，需检查)

## 安装与运行

1.  **克隆仓库:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **创建虚拟环境 (推荐):**
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **安装依赖:**
    *   检查项目根目录是否有 `requirements.txt` 文件。如果有，运行：
        ```bash
        pip install -r requirements.txt
        ```
    *   如果缺少 `requirements.txt`，根据 `app.py` 中的 `import` 语句手动安装：
        ```bash
        pip install Flask python-dotenv requests
        ```

4.  **配置环境变量:**
    *   在项目根目录下创建一个名为 `.env` 的文件。
    *   在 `.env` 文件中添加以下内容，并将 `your_..._key_here` 替换为你的实际 API 密钥：
        ```dotenv
        EPHONE_CHAT_API_KEY=your_ephone_chat_api_key_here
        DEEPSEEK_API_KEY=your_deepseek_api_key_here
        ```
    *   **重要提示:** 请确保你的 API 密钥具有足够的配额或权限来调用相应的模型 (`gpt-4o-mini-search-preview` 和 `fast/deepseek-ai/DeepSeek-V3-0324`)。

5.  **运行应用:**
    ```bash
    python app.py
    ```

6.  **访问应用:**
    在浏览器中打开 `http://127.0.0.1:1017` 或 `http://localhost:1017`。

## 文件结构

```
.
├── .env                  # 环境变量文件 (需要手动创建)
├── app.py                # Flask 应用主文件
├── static/               # 静态文件 (CSS, JS, Images, Data)
│   ├── css/
│   ├── data/
│   ├── images/
│   └── js/
├── templates/            # HTML 模板文件
│   ├── game.html
│   ├── index.html
│   ├── qa.html
│   ├── qa_iframe.html
│   ├── song.html
│   └── template.html     # (可能的基础模板)
└── README.md             # 本文件