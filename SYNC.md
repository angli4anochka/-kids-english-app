# Синхронизация локалки ↔ сервер (Яндекс VM)

Проект **kids-english-app** (Next.js) живёт на сервере и локально, синхронизируются через git.

```
сервер: /home/ubuntu/repos/kids-english-app.git   ← origin (bare-репо)
   ▲                                                     ▲
   │ push/pull                                           │ push/pull
   ▼                                                     ▼
сервер: /var/www/kids-app (живой сайт)            локалка: ~/kids-english-app
```

- **origin** = bare-репозиторий на сервере Яндекса (`ubuntu@158.160.208.163:/home/ubuntu/repos/kids-english-app.git`).
- SSH-ключ (`~/.ssh/yandex_student_reports`) уже прописан в `.git/config` (`core.sshCommand`) — отдельно указывать не нужно.
- Живой сайт: **https://uniplay-kids.ru** (PM2-процесс `kids-app-frontend`, порт 3000).

---

## Изменения сделаны НА СЕРВЕРЕ → забрать локально

На сервере (в SSH-сессии):
```bash
/home/ubuntu/kids-app-sync.sh           # закоммитит правки в /var/www/kids-app и запушит в origin
# или с сообщением: /home/ubuntu/kids-app-sync.sh "добавил урок про животных"
```

Локально:
```bash
git pull
```

## Изменения сделаны ЛОКАЛЬНО → выкатить на сервер

Локально:
```bash
git add -A && git commit -m "что сделал"
./deploy.sh        # запушит в origin, на сервере сделает pull + build + перезапуск PM2
```

## Полезное

```bash
git log --oneline -10     # история
git status                # что изменено
```

> ⚠️ Перед `git pull` на сервере не должно быть незакоммиченных правок — сначала прогоните
> `kids-app-sync.sh`, иначе pull может конфликтовать.
