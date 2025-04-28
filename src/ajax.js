function getFile(file, callback) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.overrideMimeType("text/plain");

  xmlhttp.onreadystatechange = function() {
    if(xmlhttp.readyState == XMLHttpRequest.DONE) {
      if(xmlhttp.status == 200) {
        callback(xmlhttp.responseText);
      } else if(xmlhttp.status == 400) {
        console.error('There was an error 400');
      } else {
        console.error(`error ${xmlhttp.status} was returned`);
      }
    }
  };

  xmlhttp.open("GET", file, true);
  xmlhttp.send();
}

async function getImage(file, callback) {
  const response = await fetch(file);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  callback(bitmap);
}

function downloadImage(data, name) {
  self.postMessage({
    width: data.width,
    height: data.height,
    data: data.data.buffer,
    name
  }, [data.data.buffer]);
}
