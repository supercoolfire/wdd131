let myDate = new Date();
let myYear = myDate.getFullYear();
document.getElementById("currentyear").textContent = myYear;
document.getElementById("lastModified").textContent = `Last Modified: ${document.lastModified}`;