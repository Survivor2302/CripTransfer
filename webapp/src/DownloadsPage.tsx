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

    // Envoi des données à la fonction Download et récupération de la réponse
    try {
      const response = await fetch("http://localhost:8000/download/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const filename = response.headers.get("Content-Disposition");

      if (!filename) {
        throw new Error("No Content-Disposition header found");
      }

      const encrypted = await response.blob();

      console.log(encrypted.text());

      // Convert Blob to File
      const file = new File([encrypted], filename);

      decrypt(file, hashedPassword);

      await deleteFileFromServer(id!);

      console.log("Success:");
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  function convertWordArrayToUint8Array(wordArray: any) {
    var arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
    var length = wordArray.hasOwnProperty("sigBytes")
      ? wordArray.sigBytes
      : arrayOfWords.length * 4;
    var uInt8Array = new Uint8Array(length),
      index = 0,
      word,
      i;
    for (i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
  }


  // Fonction pour decrypter le fichier
  function decrypt(file: File, key: string) {
    var reader = new FileReader();
    reader.onload = () => {
      var decrypted = CryptoJS.AES.decrypt(reader.result as any, key);
      var typedArray = convertWordArrayToUint8Array(decrypted);

      var fileDec = new Blob([typedArray]);

      var a = document.createElement("a");
      var url = window.URL.createObjectURL(fileDec);
      // remove .enc extension
      var filename = file.name.substr(0, file.name.length - 5).slice(22);

      if (filename.endsWith('_')) {
        return filename.slice(0, -1);
      }

      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    };
    reader.readAsText(file);
  }

  // Fonction pour supprimer le fichier si il est en download unique
  async function deleteFileFromServer(file_id: string) {
    const formData = new FormData();
    formData.append("file_id", file_id);

    try {
      const response = await fetch("http://localhost:8000/delete_file/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du fichier.");
      }

      console.log("Le fichier a été supprimé du serveur avec succès.");
    } catch (error) {
      console.error("Erreur lors de la suppression du fichier : ", error);
    }
  }

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
