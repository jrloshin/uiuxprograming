"use strict";
const tasks = [];
let draft = null;
let nextId = 1;
const $ = (id) => document.getElementById(id);
const nameInput = $("task-name");
const priorityInput = $("priority");

function showScreen(screen) {
  ["input", "review", "success"].forEach((name) => {
    $(name + "-screen").hidden = name !== screen;
  });
  ["one", "two", "three"].forEach((name, i) => {
    $("step-" + name).classList.toggle("active", i === ["input", "review", "success"].indexOf(screen));
  });
}
function resetForm(message = "") {
  $("task-form").reset();
  draft = null;
  $("task-error").textContent = "";
  nameInput.removeAttribute("aria-invalid");
  priorityInput.removeAttribute("aria-invalid");
  showScreen("input");
  $("form-status").textContent = message;
  nameInput.focus();
}
$("task-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const title = nameInput.value.trim();
  const priority = priorityInput.value;
  nameInput.removeAttribute("aria-invalid");
  priorityInput.removeAttribute("aria-invalid");
  $("task-error").textContent = "";
  $("form-status").textContent = "";
  if (title.length < 2 || title.length > 60) {
    $("task-error").textContent = "업무 내용을 앞뒤 공백을 제외하고 2~60자로 입력해 주세요.";
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.focus();
    return;
  }
  if (!["높음", "보통", "낮음"].includes(priority)) {
    $("task-error").textContent = "우선순위를 선택한 뒤 다시 확인해 주세요.";
    priorityInput.setAttribute("aria-invalid", "true");
    priorityInput.focus();
    return;
  }
  if (tasks.some((task) => task.title === title)) {
    $("task-error").textContent = "이미 등록한 업무예요. 목록을 확인하거나 다른 업무 내용을 입력해 주세요.";
    nameInput.setAttribute("aria-invalid", "true");
    nameInput.focus();
    return;
  }
  draft = { title, priority };
  $("review-name").textContent = title;
  $("review-priority").textContent = priority;
  showScreen("review");
  $("edit-task").focus();
});
$("edit-task").addEventListener("click", () => { showScreen("input"); nameInput.focus(); });
$("cancel-task").addEventListener("click", () => resetForm("업무 등록을 취소했어요. 새 업무를 입력할 수 있어요."));
$("new-task").addEventListener("click", () => resetForm());
$("save-task").addEventListener("click", () => {
  if (!draft) return;
  tasks.push({ id: nextId++, ...draft, done: false });
  $("saved-name").textContent = draft.title;
  draft = null;
  renderTasks();
  showScreen("success");
  $("success-title").focus();
});
function renderTasks() {
  $("task-list").replaceChildren();
  const order = { "높음": 0, "보통": 1, "낮음": 2 };
  [...tasks].sort((a, b) => order[a.priority] - order[b.priority]).forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.title;
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      li.classList.toggle("done", task.done);
      updateCount();
      $("list-status").textContent = task.title + (task.done ? " 업무를 완료했어요." : " 업무를 진행 중으로 변경했어요.");
      invalidateCheck();
    });
    label.append(checkbox, name);
    const badge = document.createElement("span");
    badge.className = "priority";
    badge.textContent = "우선순위 " + task.priority;
    li.append(label, badge);
    $("task-list").append(li);
  });
  $("empty-list").hidden = tasks.length > 0;
  updateCount();
  invalidateCheck();
}
function updateCount() {
  $("task-count").textContent = tasks.filter((task) => task.done).length + " / " + tasks.length + " 완료";
}
function invalidateCheck() {
  $("check-result").hidden = true;
  $("check-dialog").hidden = true;
  $("check-status").textContent = "";
}
// 중간고사 추가 기능: 등록과 완료 체크 이후의 퇴근 준비 점검
$("check-section").hidden = false;
$("start-check").addEventListener("click", () => {
  $("check-result").hidden = true;
  $("check-status").textContent = "";
  $("check-dialog").hidden = false;
  $("check-title").focus();
});
$("cancel-check").addEventListener("click", () => {
  $("check-dialog").hidden = true;
  $("check-result").hidden = true;
  $("check-status").textContent = "점검을 취소했어요. 업무 목록은 그대로 유지돼요.";
  $("start-check").focus();
});
$("confirm-check").addEventListener("click", () => {
  $("check-dialog").hidden = true;
  const result = $("check-result");
  result.replaceChildren();
  result.hidden = false;
  const heading = document.createElement("h3");
  const message = document.createElement("p");
  const action = document.createElement("button");
  action.type = "button";
  const remaining = tasks.filter((task) => !task.done);
  if (tasks.length === 0) {
    result.dataset.state = "empty";
    heading.textContent = "점검할 업무가 없어요";
    message.textContent = "오늘 할 일을 먼저 등록한 다음 다시 점검해 주세요.";
    action.textContent = "업무 등록하러 가기";
    action.addEventListener("click", () => {
      invalidateCheck();
      resetForm();
      $("workspace").scrollIntoView({ block: "start" });
    });
  } else if (remaining.length > 0) {
    result.dataset.state = "remaining";
    heading.textContent = "아직 남은 업무가 " + remaining.length + "개 있어요";
    message.textContent = "아래 업무를 마무리하고 목록에서 완료를 체크한 뒤 다시 점검해 주세요.";
    const list = document.createElement("ul");
    list.className = "remaining";
    remaining.forEach((task) => {
      const item = document.createElement("li");
      item.textContent = task.title + " · 우선순위 " + task.priority;
      list.append(item);
    });
    result.append(heading, message, list);
    action.textContent = "남은 업무 확인하기";
    action.addEventListener("click", () => {
      invalidateCheck();
      $("task-list").scrollIntoView({ block: "center" });
      const index = tasks.filter((task) => !task.done)[0];
      const labels = [...$("task-list").querySelectorAll("label")];
      const target = labels.find((label) => label.textContent === index?.title);
      target?.querySelector("input").focus();
    });
  } else {
    result.dataset.state = "success";
    heading.textContent = "오늘의 업무를 모두 마쳤어요!";
    message.textContent = "총 " + tasks.length + "개 업무 완료. 퇴근 준비 완료! 오늘도 수고했어요.";
    action.textContent = "목록으로 돌아가기";
    action.addEventListener("click", () => {
      invalidateCheck();
      $("workspace").scrollIntoView({ block: "start" });
      const firstTask = $("task-list").querySelector("input");
      firstTask?.focus();
    });
  }
  if (result.childElementCount === 0) result.append(heading, message);
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "secondary";
  retry.textContent = "다시 점검하기";
  retry.addEventListener("click", () => $("start-check").click());
  const actions = document.createElement("div");
  actions.className = "actions";
  actions.append(action, retry);
  result.append(actions);
  result.focus();
});
