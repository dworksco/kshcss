async function loadJSONData(url) {
  try {
    const response = await fetch(url); 
    if (!response.ok) {
      throw new Error('Cant findout your json file.');
    }
    const jsonData = await response.json(); // Parse the response as JSON
    console.log(jsonData); // Use the JSON data (which is now a normal JS object)
    return jsonData;
  } catch (error) {
    console.error('Error fetching JSON:', error);
  }
}

// Call the function with the path to your JSON file
const jsonDataString = loadJSONData('/data.json');
console.log("JSON data: " + jsonDataString);