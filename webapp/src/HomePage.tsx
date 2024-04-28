import React, { useState } from "react";
import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";

function HomePage() {
  const [formData, setFormData] = useState({
    file: null as File | null,
    password: "",
    expiryTime: 0,
    singleUseLink: false,
    email: "",
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked, files } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "file" ? files![0] : type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    var reader = new FileReader();
    reader.onload = async () => {
      var encryptionPassword = CryptoJS.SHA256(formData.password).toString();
      var wordArray = CryptoJS.lib.WordArray.create(
        reader.result as ArrayBuffer
      ); // Convert: ArrayBuffer -> WordArray
      var encrypted = CryptoJS.AES.encrypt(
        wordArray,
        encryptionPassword
      ).toString(); // Encryption: I: WordArray -> O: -> Base64 encoded string (OpenSSL-format)

      var fileEnc = new Blob([encrypted]); // Create blob from string

      // Préparation des données à envoyer
      const sendToServer = new FormData();

      sendToServer.append("file", fileEnc, formData.file!.name + ".enc");
      sendToServer.append("password", encryptionPassword);
      sendToServer.append("email", formData.email);
      sendToServer.append("expiryTime", formData.expiryTime.toString());
      sendToServer.append("singleUseLink", formData.singleUseLink.toString());

      // Envoi du fichier chiffré au serveur
      try {
        const response = await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: sendToServer,
        });
        if (response.ok) {
          console.log("Fichier envoyé avec succès");
          //clear form
          // const form = document.getElementById("uploadForm") as HTMLFormElement;
          // form.reset();
        } else {
          console.error("Erreur lors de l'envoi du fichier");
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi du fichier", error);
      }
    };
    reader.readAsArrayBuffer(formData.file!);
  };

  return (
    <div>
      <h1>Plateforme de stockage de fichiers sécurisée</h1>
      <form
        id="uploadForm"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
      >
        <h2>Téléverser un fichier</h2>
        <input
          type="file"
          id="file"
          name="file"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          id="encryptionPassword"
          name="password"
          placeholder="Mot de passe de chiffrement"
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="date"
          id="expiryTime"
          name="expiryTime"
          min={
            new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          }
          placeholder="Délai d'expiration"
          onChange={handleChange}
        />
        <br />
        <label htmlFor="singleUseLink">Lien à usage unique</label>
        <input
          type="checkbox"
          id="singleUseLink"
          name="singleUseLink"
          onChange={handleChange}
        />
        <br />
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Email pour envoyer le lien"
          onChange={handleChange}
          required
        />
        <br />
        <input type="submit" value="Téléverser" />
      </form>
    </div>
  );
}

export default HomePage;
