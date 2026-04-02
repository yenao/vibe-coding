import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update,
  remove,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAMSwqPEPQddWoEhKm-7D3VHfK8iUxfahY",
  authDomain: "todo-backend-65a76.firebaseapp.com",
  projectId: "todo-backend-65a76",
  storageBucket: "todo-backend-65a76.firebasestorage.app",
  messagingSenderId: "189107926918",
  appId: "1:189107926918:web:f8feaad5ca7f993df4de07",
  databaseURL: "https://todo-backend-65a76-default-rtdb.firebaseio.com/",
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

const TODOS_PATH = "todos";

/** @param {string} id */
function todoRef(id) {
  return ref(rtdb, `${TODOS_PATH}/${id}`);
}

const addForm = document.getElementById("add-form");
const newTodoInput = document.getElementById("new-todo");
const listEl = document.getElementById("todo-list");
const emptyState = document.getElementById("empty-state");
const dbStatusEl = document.getElementById("db-status");

/** @param {string} message @param {"error"|""} kind */
function setDbStatus(message, kind = "error") {
  if (!dbStatusEl) return;
  if (!message) {
    dbStatusEl.hidden = true;
    dbStatusEl.textContent = "";
    dbStatusEl.className = "db-status";
    dbStatusEl.removeAttribute("role");
    return;
  }
  dbStatusEl.hidden = false;
  dbStatusEl.className =
    "db-status" + (kind === "error" ? " db-status--error" : "");
  dbStatusEl.setAttribute("role", kind === "error" ? "alert" : "status");
  dbStatusEl.textContent = message;
}

/** @param {unknown} err */
function formatRtdbError(err) {
  const code =
    err && typeof err === "object" && "code" in err
      ? String(/** @type {{ code?: string }} */ (err).code)
      : "";
  const base =
    err && typeof err === "object" && "message" in err
      ? String(/** @type {{ message?: string }} */ (err).message)
      : String(err);

  if (code === "PERMISSION_DENIED" || /permission/i.test(base)) {
    return (
      "Realtime Database 접근이 거부되었습니다. Firebase 콘솔 → Realtime Database → 규칙에서 " +
      "`/todos` 경로 읽기·쓰기를 허용했는지 확인하세요."
    );
  }
  if (code === "UNAVAILABLE" || /network/i.test(base)) {
    return "네트워크 오류로 데이터베이스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  return base || "알 수 없는 오류가 발생했습니다.";
}

/** @typedef {{ id: string, text: string, done: boolean }} Todo */

let todos = [];
let editingId = null;

/** @param {unknown} raw */
function createdAtToMillis(raw) {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return 0;
}

onValue(
  ref(rtdb, TODOS_PATH),
  (snapshot) => {
    setDbStatus("", "");
    const val = snapshot.val();
    if (!val || typeof val !== "object") {
      todos = [];
    } else {
      todos = Object.entries(val)
        .map(([id, v]) => {
          const row = v && typeof v === "object" ? v : {};
          return {
            id,
            text: typeof row.text === "string" ? row.text : "",
            done: Boolean(row.done),
            _ts: createdAtToMillis(row.createdAt),
          };
        })
        .sort((a, b) => a._ts - b._ts)
        .map(({ id, text, done }) => ({ id, text, done }));
    }
    render();
  },
  (err) => {
    console.error("Realtime Database 구독 오류:", err);
    setDbStatus(formatRtdbError(err), "error");
    render();
  }
);

function updateEmptyState() {
  emptyState.hidden = todos.length > 0;
}

/** @param {Todo} todo */
function createItemElement(todo) {
  const li = document.createElement("li");
  li.className = "item";
  li.dataset.id = todo.id;

  const check = document.createElement("input");
  check.type = "checkbox";
  check.className = "item-check";
  check.checked = todo.done;
  check.setAttribute("aria-label", "완료 표시");
  check.addEventListener("change", async () => {
    try {
      await update(todoRef(todo.id), { done: check.checked });
    } catch (e) {
      console.error(e);
      check.checked = todo.done;
      setDbStatus(formatRtdbError(e), "error");
    }
  });

  const body = document.createElement("div");
  body.className = "item-body";

  const actions = document.createElement("div");
  actions.className = "item-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-ghost";
  editBtn.textContent = "수정";
  editBtn.addEventListener("click", () => {
    editingId = todo.id;
    render();
    queueMicrotask(() => {
      const input = listEl.querySelector(
        `li[data-id="${CSS.escape(todo.id)}"] .item-edit-input`
      );
      if (input) {
        input.focus();
        input.select();
      }
    });
  });

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn btn-danger";
  delBtn.textContent = "삭제";
  delBtn.addEventListener("click", async () => {
    delBtn.disabled = true;
    try {
      if (editingId === todo.id) editingId = null;
      await remove(todoRef(todo.id));
    } catch (e) {
      console.error(e);
      setDbStatus("삭제 실패: " + formatRtdbError(e), "error");
      delBtn.disabled = false;
    }
  });

  actions.append(editBtn, delBtn);

  if (editingId === todo.id) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "item-edit-input";
    input.value = todo.text;
    input.maxLength = 200;
    input.setAttribute("aria-label", "할 일 수정");

    const finishEdit = async (save) => {
      if (save) {
        const next = input.value.trim();
        if (next) {
          saveBtn.disabled = true;
          cancelBtn.disabled = true;
          try {
            await update(todoRef(todo.id), { text: next });
            setDbStatus("", "");
          } catch (e) {
            console.error(e);
            setDbStatus("수정 실패: " + formatRtdbError(e), "error");
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            return;
          }
        }
      }
      editingId = null;
      render();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEdit(true);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        finishEdit(false);
      }
    });

    const row = document.createElement("div");
    row.className = "item-edit-row";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary btn-sm";
    saveBtn.textContent = "저장";
    saveBtn.addEventListener("click", () => finishEdit(true));

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-ghost";
    cancelBtn.textContent = "취소";
    cancelBtn.addEventListener("click", () => finishEdit(false));

    row.append(input, saveBtn, cancelBtn);
    body.appendChild(row);
    editBtn.disabled = true;
    delBtn.disabled = true;
  } else {
    const p = document.createElement("p");
    p.className = "item-text" + (todo.done ? " done" : "");
    p.textContent = todo.text;
    body.appendChild(p);
  }

  li.append(check, body, actions);
  return li;
}

function render() {
  listEl.replaceChildren();
  todos.forEach((todo) => {
    listEl.appendChild(createItemElement(todo));
  });
  updateEmptyState();
}

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = newTodoInput.value.trim();
  if (!text) return;
  try {
    await push(ref(rtdb, TODOS_PATH), {
      text,
      done: false,
      createdAt: serverTimestamp(),
    });
    setDbStatus("", "");
    newTodoInput.value = "";
    newTodoInput.focus();
  } catch (err) {
    console.error("할 일 추가 실패:", err);
    setDbStatus("추가 실패: " + formatRtdbError(err), "error");
  }
});

render();
newTodoInput.focus();
