const bomForm = document.querySelector('#bomForm');
const favoriteChapter = document.querySelector('#favoriteChapter');
const list = document.querySelector('#list');

// Declare and initialize array using data fetching logic or fallback
let chaptersArray = getChapterList() || [];

// Populate dynamic items on initialization
chaptersArray.forEach(chapter => {
  displayList(chapter);
});

// Primary single-point-of-entry via form submission handler
bomForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Stop page reload behavior

  const value = favoriteChapter.value.trim();

  if (value !== '') { 
    displayList(value); 
    chaptersArray.push(value);  
    setChapterList(); 
    favoriteChapter.value = ''; 
    favoriteChapter.focus(); 
  }
});

function displayList(item) {
  let li = document.createElement('li');
  let deletebutton = document.createElement('button');
  
  li.textContent = item; 
  deletebutton.textContent = '❌';
  deletebutton.classList.add('delete'); 
  
  li.append(deletebutton);
  list.append(li);
  
  deletebutton.addEventListener('click', function () {
    list.removeChild(li);
    deleteChapter(li.textContent); 
    favoriteChapter.focus(); 
  });
}

function setChapterList() {
  localStorage.setItem('myFavBOMList', JSON.stringify(chaptersArray));
}

function getChapterList() {
  return JSON.parse(localStorage.getItem('myFavBOMList'));
}

function deleteChapter(chapter) {
  // Slices off the ❌ icon text from the string end safely
  chapter = chapter.slice(0, chapter.length - 1);
  chaptersArray = chaptersArray.filter(item => item !== chapter);
  setChapterList();
}