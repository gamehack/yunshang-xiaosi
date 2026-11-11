# 技术架构 v1.0

## 客户端
React + TypeScript + Phaser 3；Tilemap + Sprite Atlas；本地寻路、碰撞、动画和音频；移动触控优先。

## 网络
HTTPS 接入，WebSocket 房间通信。消息类型 join/snapshot/move/action/leave/heartbeat；带 protocol_version、session_id、sequence、timestamp；服务端校验坐标、速率、动作合法性。客户端插值渲染，初始目标 5–10Hz 同步。

## 服务端
候选 Cloudflare Workers + Durable Objects，每房间一个 DO，目标 30 人，50 人压测；满房分片、断线会话超时回收、房间空闲回收、速率限制。**中国大陆网络实测及合规确认前，不锁定生产云厂商。** 定义 RoomTransport 接口隔离实现。

## 数据与隐私
不采集真实姓名/手机号/自由文本；短期匿名会话，最小化事件统计；匿名标识与安全日志保留期限需在上线前确定；公开页面必须具备隐私告知。

## 可观测性
scene_ready, temple_entered, room_joined, interaction_used, share_clicked, session_ended；错误率、连接成功率、延迟、房间人数；后续对接独立 ops 服务。

## 测试
单元：状态机、碰撞、消息校验；集成：双端同步、断线恢复、满房；压力：30/50 同房；真机：Android 微信浏览器/Chrome、iOS Safari/微信浏览器。

## 禁止事项
未批准前不部署生产，不配置付费，不公开运营。