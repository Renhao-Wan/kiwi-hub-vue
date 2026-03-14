# 属性测试说明

本目录包含基于属性的测试（Property-Based Testing），使用 `fast-check` 库验证系统的通用正确性属性。

## 测试文件

### 1. form-validation.property.test.js
**测试属性**: Property 1 - 表单验证拒绝无效输入

**验证需求**: 3.3, 5.3, 5.4, 9.7, 14.6

**测试用例**:
- ✅ 对于任意无效的邮箱格式，验证器应该拒绝
- ✅ 对于任意有效的邮箱格式，验证器应该接受
- ✅ 对于任意不符合密码强度要求的密码，验证器应该拒绝
- ✅ 对于任意符合密码强度要求的密码（6-12位，包含字母和数字），验证器应该接受
- ✅ 对于任意无效的用户名（非3-20个字符），验证器应该拒绝
- ✅ 对于任意有效的用户名（3-20个字符），验证器应该接受
- ✅ 对于任意超长的文章标题（超过 100 字符），验证应该拒绝
- ✅ 对于任意空的文章标题，验证应该拒绝
- ✅ 对于任意有效的文章标题（1-100字符），验证应该接受
- ✅ 对于任意空的文章内容，验证应该拒绝
- ✅ 对于任意有效的文章内容（非空），验证应该接受
- ✅ 对于任意超长的评论内容（超过 500 字符），验证应该拒绝
- ✅ 对于任意空的评论内容，验证应该拒绝
- ✅ 对于任意有效的评论内容（1-500字符），验证应该接受
- ✅ 对于任意超长的个人简介（超过 200 字符），验证应该拒绝
- ✅ 对于任意有效的个人简介（0-200字符），验证应该接受
- ✅ 对于任意包含特殊字符的邮箱，验证器应该正确处理
- ✅ 对于任意边界值的密码长度，验证器应该正确判断
- ✅ 对于任意边界值的用户名长度，验证器应该正确判断
- ✅ 对于任意包含 Unicode 字符的输入，验证器应该正确处理

### 2. request-interceptor.property.test.js
**测试属性**: Property 3 - 请求自动注入认证 Token

**验证需求**: 3.8, 16.1, 16.2

**测试用例**:
- ✅ 对于任意 HTTP 方法和 URL，已登录时应该自动注入 Token
- ✅ 对于任意请求，未登录时不应该注入 Token
- ✅ 对于任意请求数据，Token 注入不应该影响请求体
- ✅ 对于任意 Token 格式，都应该正确添加 Bearer 前缀
- ✅ 对于任意已存在的 headers，Token 注入不应该覆盖其他 header
- ✅ Token 变化时，应该注入最新的 Token
- ✅ 对于任意请求，Content-Type 应该始终为 application/json

### 2. response-interceptor.property.test.js
**测试属性**: 
- Property 13 - 响应拦截器统一处理错误状态码
- Property 14 - 响应拦截器返回统一数据格式

**验证需求**: 16.3, 16.4, 16.5, 16.6, 16.7, 16.8

**Property 13 测试用例**:
- ✅ 对于任意 401 错误，应该清除 Token 并重定向到登录页
- ✅ 对于任意 400 错误，应该显示错误消息
- ✅ 对于任意 500 错误，应该显示服务器错误消息
- ✅ 对于任意 503 错误，应该显示服务不可用消息
- ✅ 对于任意其他 HTTP 状态码错误，应该显示错误消息
- ✅ 对于任意网络连接失败，应该显示网络错误消息
- ✅ 对于任意其他类型的错误，应该显示错误消息

**Property 14 测试用例**:
- ✅ 对于任意成功响应（code === 20000），应该返回 { data, message } 格式
- ✅ 对于任意业务错误响应（code !== 20000），应该显示错误并拒绝 Promise
- ✅ 对于任意嵌套的复杂数据结构，应该正确提取并返回
- ✅ 对于任意空数据或 null 数据，应该正确处理
- ✅ 对于任意响应，不应该修改原始响应对象
- ✅ 对于任意包含特殊字符的消息，应该正确返回

### 3. api-layer.property.test.js
**测试属性**: Property 10 - API 调用使用正确的端点和参数

**验证需求**: 3.2, 3.5, 4.1, 5.5, 6.1, 7.2, 8.2, 9.2, 9.4, 10.1, 11.3, 13.1, 13.6, 14.3, 15.2

**测试用例**:
- ✅ 对于任意注册数据，register API 应该调用 POST /users/register
- ✅ 对于任意登录凭证，login API 应该调用 POST /users/login
- ✅ 对于任意分页参数，getArticleList API 应该调用 GET /articles/s
- ✅ 对于任意文章数据，publishArticle API 应该调用 POST /articles
- ✅ 对于任意文章 ID，getArticleDetail API 应该调用 GET /articles/{articleId}
- ✅ 对于任意文章 ID 和作者 ID，toggleLike API 应该调用 POST /interactions/like
- ✅ 对于任意文章 ID 和分页参数，getRootComments API 应该调用 GET /comments/roots
- ✅ 对于任意一级评论数据，publishComment API 不应该包含 parentId 和 rootId
- ✅ 对于任意回复评论数据，publishComment API 应该包含 parentId 和 rootId
- ✅ 对于任意根评论 ID 和游标，getReplies API 应该调用 GET /comments/replies
- ✅ 对于任意文章 ID，generateShortLink API 应该调用 POST /links/generate
- ✅ 对于任意评论 ID，deleteComment API 应该调用 DELETE /comments/{commentId}
- ✅ 对于任意分页参数，getMyArticles API 应该调用 GET /articles/me
- ✅ 对于任意资料数据，updateProfile API 应该调用 PUT /users/me/profile
- ✅ 对于任意搜索参数，searchArticles API 应该调用 GET /search/articles
- ✅ getCurrentUser API 应该调用 GET /users/me
- ✅ logout API 应该调用 POST /users/logout
- ✅ 对于任意文章 ID，deleteArticle API 应该调用 DELETE /articles
- ✅ 对于任意用户 ID，followUser API 应该调用 POST /users/follow
- ✅ 对于任意用户 ID，unfollowUser API 应该调用 DELETE /users/follow
- ✅ 对于任意分页参数，getFollowingList API 应该调用 GET /users/following
- ✅ 对于任意分页参数，getFollowersList API 应该调用 GET /users/followers
- ✅ 对于任意短链接代码，getLongLink API 应该调用 GET /links/s/{code}

### 4. home-page.property.test.js
**测试属性**: 
- Property 7 - UI 组件渲染所有必需字段
- Property 8 - 文章卡片点击跳转到详情页

**验证需求**: 4.3, 4.4, 4.7

**Property 7 测试用例**:
- ✅ 对于任意文章数据，ArticleCard 应该渲染所有必需字段
- ✅ 对于任意包含空标签数组的文章，ArticleCard 应该正确处理
- ✅ 对于任意极大的统计数字，ArticleCard 应该正确格式化显示（K/M 单位）
- ✅ 对于任意零值的统计数字，ArticleCard 应该正确显示
- ✅ 对于任意不同时间的文章，ArticleCard 应该正确格式化时间显示
- ✅ 对于任意包含特殊字符的文章数据，ArticleCard 应该正确转义和显示

**Property 8 测试用例**:
- ✅ 对于任意文章，点击 ArticleCard 应该跳转到对应的详情页
- ✅ 对于任意文章 ID 格式，ArticleCard 应该正确传递到路由参数
- ✅ 对于任意文章，多次点击 ArticleCard 应该多次触发路由跳转
- ✅ 对于任意文章列表，每个 ArticleCard 应该跳转到各自的详情页

## 运行测试

```bash
# 运行所有属性测试
npm test tests/properties/

# 运行特定的属性测试
npm test tests/properties/form-validation.property.test.js
npm test tests/properties/request-interceptor.property.test.js
npm test tests/properties/response-interceptor.property.test.js
npm test tests/properties/api-layer.property.test.js
npm test tests/properties/user-store.property.test.js
npm test tests/properties/router-guard.property.test.js
npm test tests/properties/home-page.property.test.js
```

## 测试配置

每个属性测试默认运行 100 次迭代（`numRuns: 100`），确保覆盖大量随机生成的输入场景。

## 测试策略

属性测试与单元测试互补：
- **属性测试**: 验证通用规则在所有情况下都成立（使用随机生成的数据）
- **单元测试**: 验证特定示例和边缘情况

## 依赖

- `vitest`: 测试框架
- `fast-check`: 属性测试库
- `happy-dom`: DOM 环境模拟
