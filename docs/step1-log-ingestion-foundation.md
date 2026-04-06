# How to Test Step 2 (Log Writing & File Watcher)

Now that the log ingestion foundation is built, we need to test that:
1. The **APIs** generate structured log events.
2. The **Log Writer** appends these events correctly to `logs/app.log`.
3. The **File Watcher Service** detects the new lines instantly and passes them to the log processor.

Here is a step-by-step guide to verify everything works manually.

---

## 1. Ensure the Server is Running

Make sure you have your Node.js server running in development mode.
You should already see something like this in your active terminal:

```bash
npm run dev
```
```text
🚀 API running on port 5000
[WATCHER] 👁️  Monitoring log directory: .../logs
```

Keep this terminal open, as you will need to observe its output shortly.

---

## 2. Trigger API Endpoints

Open **a new/separate terminal instance** (or use an API tool like Postman/Insomnia) and execute the following cURL commands one by one to simulate traffic.

### Test A: Normal Traffic (`GET /products`)
```bash
curl -X GET http://localhost:5000/api/v1/products
```

### Test B: Unauthorized Access Request (`GET /admin`)
```bash
curl -X GET http://localhost:5000/api/v1/admin
```

### Test C: Failed Login Injection (`POST /auth/login`)
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"admin\",\"password\":\"wrong\"}"
```

### Test D: Successful Login (`POST /auth/login`)
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

---

## 3. Verify the Raw Log File

Use your text editor or IDE to open the newly generated log file:
📂 `logs/app.log`

You should see new lines structured accurately with timestamps, like this:
```text
2026-04-06T17:22:30.115Z event=REQUEST ip=127.0.0.1 path=/products status=200 method=GET
2026-04-06T17:22:30.409Z event=REQUEST ip=127.0.0.1 path=/admin status=403 method=GET
2026-04-06T17:23:49.546Z event=FAILED_LOGIN ip=127.0.0.1 user=admin path=/auth/login status=401 method=POST
2026-04-06T17:23:32.330Z event=LOGIN_SUCCESS ip=127.0.0.1 user=admin path=/auth/login status=200 method=POST
```
*Note: Your timestamps and IP address formats might naturally differ.*

---

## 4. Verify the Watcher Output in the Terminal

Switch back to the terminal where `npm run dev` is actively running. 

Because the **File Watcher Service** is actively reading file offsets in real-time as lines append, you should see console logs firing from both the **Watcher** and the **Processor Hook**:

```text
2026-04-06 17:22:30 [info]: [WATCHER] New log line detected: 2026... event=REQUEST...
2026-04-06 17:22:30 [info]: [PROCESSOR] Raw log line received: 2026... event=REQUEST...

2026-04-06 17:22:30 [info]: [WATCHER] New log line detected: 2026... event=REQUEST... status=403...
2026-04-06 17:22:30 [info]: [PROCESSOR] Raw log line received: 2026... event=REQUEST... status=403...

2026-04-06 17:23:49 [info]: [WATCHER] New log line detected: 2026... event=FAILED_LOGIN...
2026-04-06 17:23:49 [info]: [PROCESSOR] Raw log line received: 2026... event=FAILED_LOGIN...
```

### ✅ Success Criteria
If you see the raw log strings passing through `[PROCESSOR]`, the event-driven log pipeline is perfectly initialized and ready for Step 3 logic!
