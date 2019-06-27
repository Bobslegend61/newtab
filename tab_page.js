(function() {
  const body = document.querySelector('body').style,
    hour = document.querySelector('.hour'),
    minute = document.querySelector('.minute'),
    amPm = document.querySelector('#time .tod'),
    greeting = document.querySelector('#greeting .tod'),
    name = document.querySelector('#greeting .name'),
    focus = document.querySelector('#focus p'),
    taskForm = document.querySelector('.task-form form'),
    tasksNavs = document.querySelectorAll('#tasks-nav button'),
    taskUl = document.querySelector('#task .tasks ul');
  let taskCheckBox = document.querySelectorAll(
    '#task .tasks ul li input[type="checkbox"]'
  );
  let taskDelete = document.querySelectorAll('#task .tasks ul li i');

  // LISTENERS
  focus.addEventListener('blur', setFocus);
  focus.addEventListener('keypress', setFocus);

  name.addEventListener('blur', setName);
  name.addEventListener('keypress', setName);

  taskForm.addEventListener('submit', addTask);

  tasksNavs.forEach(nav => nav.addEventListener('click', filterNav));

  // FUNCTIONS

  function filterNav(e) {
    tasksNavs.forEach(nav => nav.classList.remove('active-nav'));
    e.target.classList.add('active-nav');
    filterTasks(e.target.id);
  }

  function filterTasks(id) {
    chrome.storage.sync.get(['tasks'], ({ tasks }) => {
      switch (id) {
        case 'completed':
          getTasks(tasks.filter(task => task.completed === true));
          break;
        case 'active':
          getTasks(tasks.filter(task => task.completed === false));
          break;
        default:
          getTasks(tasks);
      }
    });
  }

  function unOrCompleteOrDeleteTask(e) {
    let id = parseInt(e.target.id);
    if (e.target.localName === 'input') {
      chrome.storage.sync.get(['tasks'], ({ tasks }) => {
        tasks.forEach(task => {
          if (task.id === id) {
            task.completed = !task.completed;
          }
        });

        chrome.storage.sync.set({ tasks });
      });
    } else {
      chrome.storage.sync.get(['tasks'], ({ tasks }) => {
        tasks = tasks.filter(task => task.id !== id);
        tasks.forEach((task, i) => (task.id = i + 1));
        chrome.storage.sync.set({ tasks });
      });
    }
  }

  function getTasks(tasks) {
    // chrome.storage.sync.get(['tasks'], result => {
    if (tasks) {
      // tasks = result.tasks;
      if (tasks.length > 0) {
        taskUl.innerHTML = '';
        let domEl = tasks.map(
          task =>
            `
              <li>
                <input type="checkbox" id="${task.id}" ${
              task.completed ? 'checked' : ''
            }/>
                <p>${task.title}</p>
                <i class="material-icons" id="${task.id}">delete</i>
              </li>
            `
        );

        domEl.forEach(e => (taskUl.innerHTML += e));

        taskCheckBox = document.querySelectorAll(
          '#task .tasks ul li input[type="checkbox"]'
        );
        taskDelete = document.querySelectorAll('#task .tasks ul li i');

        taskCheckBox.forEach(checkBox =>
          checkBox.addEventListener('click', unOrCompleteOrDeleteTask)
        );
        taskDelete.forEach(i =>
          i.addEventListener('click', unOrCompleteOrDeleteTask)
        );
      } else {
        taskUl.innerHTML = `
          <li><p></p><p>No tasks found</p><p></p></li>
          `;
      }
    } else {
      taskUl.innerHTML = `
            <li><p></p><p>No tasks found</p><p></p></li>
          `;
    }
    // });
  }

  function addTask(e) {
    e.preventDefault();
    const taskText = document.querySelector('#task-text').value;

    if (taskText.trim() === '') {
      const taskError = document.querySelector('.task-error');
      taskError.innerText = 'Field cannot be empty';
      taskError.style.display = 'block';
      setTimeout(() => {
        taskError.style.display = 'none';
      }, 3000);
      return false;
    }

    chrome.storage.sync.get(['tasks'], ({ tasks }) => {
      if (tasks) {
        let check = tasks.filter(
          task => task.title.toUpperCase() === taskText.toUpperCase()
        );
        if (check.length > 0) {
          const taskError = document.querySelector('.task-error');
          taskError.innerText = 'Task Already Exist';
          taskError.style.display = 'block';
          setTimeout(() => {
            taskError.style.display = 'none';
          }, 3000);
          return;
        }
        tasks.push({ id: tasks.length + 1, title: taskText, completed: false });
        chrome.storage.sync.set({ tasks });
      } else {
        chrome.storage.sync.set({
          tasks: [{ id: 1, title: taskText, completed: false }]
        });
      }
    });

    document.querySelector('#task-text').value = '';
  }

  function setFocus(e) {
    if (
      e.type === 'blur' ||
      (e.type === 'keypress' && e.key === 'Enter' && e.keyCode === 13)
    ) {
      chrome.storage.sync.set({ focus: e.target.innerText }, () =>
        console.log(`Focus saved as ${e.target.innerText}`)
      );

      chrome.storage.sync.set({ date: new Date().toDateString() });
      if (e.type === 'keypress') {
        e.target.blur();
      }
    }
  }

  function setName(e) {
    if (
      e.type === 'blur' ||
      (e.type === 'keypress' && e.key === 'Enter' && e.keyCode === 13)
    ) {
      chrome.storage.sync.set({ name: e.target.innerText }, () =>
        console.log(`Name saved as ${e.target.innerText}`)
      );
      if (e.type === 'keypress') {
        e.target.blur();
      }
    }
  }

  function init() {
    chrome.storage.onChanged.addListener(({ tasks }) => {
      const activeTaskNav = document.querySelector('.active-nav');
      if (tasks) {
        filterTasks(activeTaskNav.id);
      }
    });

    chrome.storage.sync.get(['focus', 'date', 'name', 'tasks'], result => {
      if (result.focus) {
        focus.innerHTML = result.focus;
      }

      if (result.name) {
        name.innerHTML = result.name;
      }

      if (result.date !== new Date().toDateString()) {
        chrome.storage.sync.set(
          { focus: `What's Your Main Focus For Today.[Edit Me]` },
          () => {
            console.log(`New day`);
            chrome.storage.sync.set({ date: new Date().toDateString() });
            chrome.storage.sync.set({ tasks: [] });
          }
        );
      }

      getTasks(result.tasks);
    });

    const thingsILove = [
      'morning',
      'afternoon',
      'evening',
      'night',
      'houses',
      'cars',
      'programming',
      'nature',
      'design',
      'sunrise',
      'sunset',
      'interior design'
    ];
    fetch(
      `https://pixabay.com/api/?key=8777107-3896f9600dd63ea6c8fd2c9a6&q=${encodeURIComponent(
        Math.round(Math.random() * (thingsILove.length - 1))
      )}&image_type=photo`
    )
      .then(response => response.json())
      .then(json => {
        const rand = Math.round(Math.random() * 20);
        body.backgroundImage = `url(${json.hits[rand].largeImageURL})`;
        body.backgroundRepeat = 'no-repeat';
        body.backgroundPosition = 'center center';
        body.backgroundSize = 'cover';
      })
      .catch(err => {
        body.backgroundRepeat = 'no-repeat';
        body.backgroundPosition = 'center center';
        body.backgroundSize = 'cover';
        switch (greeting.textContent) {
          case 'Morning':
            body.backgroundImage = `url('./morning.jpg')`;
            break;
          case 'Afternoon':
            body.backgroundImage = `url('./afternoon.jpg')`;
            break;
          case 'Evening':
            body.backgroundImage = `url('./evening.jpg')`;
        }
      });

    // chrome.storage.sync.set({ tasks: [] });
    setTime();
  }

  function addTraillingZero(digit) {
    return parseInt(digit, 10) < 10 ? `0${digit}` : digit;
  }

  function setTime() {
    const time = new Date();
    let h = time.getHours();
    if (h < 12) {
      amPm.innerHTML = 'AM';
      greeting.innerHTML = 'Morning';
    } else {
      amPm.innerHTML = 'PM';
      if (h < 16) {
        greeting.innerHTML = 'Afternoon';
      } else {
        greeting.innerHTML = 'Evening';
      }
    }

    if (h > 12) {
      h = h % 12;
    }

    const m = time.getMinutes();
    const s = time.getSeconds();

    hour.innerHTML = addTraillingZero(h);
    minute.innerHTML = addTraillingZero(m);

    setInterval(setTime, 1000);
  }
  // App initialization
  init();
})();
