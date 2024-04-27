import { useParams } from "react-router-dom";
import { useState } from "react";
import CryptoJS from "crypto-js";

function DownloadsPage() {
  const { id } = useParams();
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();

    const hashedPassword = CryptoJS.SHA256(password).toString();
    const formData = new FormData();
    formData.append("file_id", id!);
    formData.append("password", hashedPassword);

    try {
      const response = await fetch("http://localhost:8000/download", {
        method: "POST",
        body: formData,
      });

      console.log(response);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const hashedFileName = response.headers.get("Content-Disposition");
      console.log("filename : " + hashedFileName)

      if (!hashedFileName) {
        throw new Error("No Content-Disposition header found");
      }

      const blob = await response.blob();
      console.log("blob:", blob.text);

      const arrayBuffer = await blob.arrayBuffer();
      console.log("arrayBuffer:", arrayBuffer.slice);

      // Convertir ArrayBuffer en WordArray de CryptoJS
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      console.log("wordArray:", wordArray.words);


      // Convertir WordArray en chaîne Base64
      const encryptedData = wordArray.toString(CryptoJS.enc.Base64);


      console.log("hash : " + hashedPassword);
      // Décrypter les données
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        hashedPassword,

      ).toString();


      /*const decrypted = CryptoJS.AES.decrypt(
        encryptedData,
        hashedPassword,
        {
          mode: CryptoJS.mode.CFB,
          padding: CryptoJS.pad.Pkcs7,
        }
      );
      */

      console.log("decrycpter : " + decrypted);

      // Convertir le résultat décrypté en texte UTF-8
      //const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      //console.log("decrypted text:", decryptedText);


      // Convertir le texte décrypté en Blob pour téléchargement
      const decryptedBlob = new Blob([decrypted], {
        type: "application/octet-stream",
      });


      const url = window.URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      console.log(a);
      a.href = url;
      a.download = "decrypted_file.png"; // Utilisez le nom de fichier approprié
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();


      console.log("Success:", decrypted);

    } catch (error) {
      console.error("Error downloading the file:", error);
    }
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
    </div>
  );
}

export default DownloadsPage;

function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = (e) => {
      reject(new Error("Failed to read blob to arrayBuffer"));
    };
    reader.readAsArrayBuffer(blob);
  });
}
