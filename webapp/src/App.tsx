import React, { useState, useEffect } from "react";

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setData(data.message);
      });
  }, []);

  return (
    <div>
      <h1>Mon application React</h1>
      <p>Bienvenue !</p>
      {data && <p>Données de l'API : {data}</p>}
    </div>
  );
}

export default App;
