FROM nginx:alpine

# 删除默认的nginx静态资源
RUN rm -rf /usr/share/nginx/html/*

# 复制前端文件到nginx目录
COPY ./ai /usr/share/nginx/html/ai
COPY ./analysis /usr/share/nginx/html/analysis
COPY ./index /usr/share/nginx/html/index
COPY ./upload /usr/share/nginx/html/upload
COPY ./Router.js /usr/share/nginx/html/Router.js

# 创建自定义nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 