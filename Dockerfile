FROM node:10-alpine AS lev-report

RUN apk add --no-cache ca-certificates git make python \
 && apk upgrade --no-cache \
 && addgroup -S app \
 && adduser -S app -G app -u 31338 -h /app/ \
 && chown -R app:app /app/

WORKDIR /app
COPY LICENSE package.json package-lock.json README.md /app/
COPY pages /app/pages
COPY src /app/src

USER 31338
ENV NODE_ENV="production"

RUN npm install --only production

ENV HTTP_HOST="0.0.0.0" \
    HTTP_PORT="4000" \
    DB_HOST="localhost" \
    DB_PORT="5432" \
    DB_DB="lev"
ENTRYPOINT node .


FROM lev-report AS lev-report-test

COPY .eslintignore .eslintrc.yaml /app/
COPY assets /app/assets
COPY test /app/test

ENV NODE_ENV="test"

RUN npm install

ENTRYPOINT npm test


FROM lev-report

USER root
RUN apk del --no-cache git make python

USER 31338
WORKDIR /app
COPY --from=lev-report-test /app/public /app/public
