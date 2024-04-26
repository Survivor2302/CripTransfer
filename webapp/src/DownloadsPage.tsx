import { useParams } from "react-router-dom";
import { useState } from "react";
import CryptoJS from "crypto-js";

function DownloadsPage() {
  const { id } = useParams();
  const [password, setPassword] = useState("");

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const hashedPassword = CryptoJS.SHA256(password).toString();
    const formData = new FormData();
    formData.append("file_id", id!);
    formData.append("password", hashedPassword);

    fetch("http://localhost:8000/download", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        console.log(response);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const hashedFileName = response.headers.get("Content-Disposition");

        if (!hashedFileName) {
          throw new Error("No Content-Disposition header found");
        }

        return response.blob();
      })
      .then((blob) => {
        /*
        ###########################
        @@@@@faut decrypter la@@@@@
        ###########################
        */
        console.log("Success:", blob);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      })
      .catch((error) => console.error("Error downloading the file:", error));
  };

  return (
    <div>
      <h1>Download ID: {id}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button type="submit">Download</button>
      </form>
      {/* Autres éléments de l'interface utilisateur */}
    </div>
  );
}

export default DownloadsPage;
