// ===== EDITA AQUI: dados do site e posts =====
window.SITE = {
  name: "Die Elf",
  email: "teu@email.com"            // <- troca pelo teu e-mail
};

// Cada post: id único, data (AAAA-MM-DD), image (opcional), título e corpo em pt e de.
// O corpo é HTML (<p>, <h2>, <ul>, <blockquote>...). Não uses crases ` dentro do texto.
// Posts mais recentes = data mais recente (a ordem no ficheiro não importa).
window.POSTS = [
  {
    id: "exemplo-primeiro-post",
    date: "2026-10-15",
    image: "",
    title: {
      pt: "Exemplo: título do teu primeiro post sobre a Bundesliga",
      de: "Beispiel: Titel deines ersten Beitrags über die Bundesliga"
    },
    body: {
      pt: `<p>Este é um post de exemplo. Apaga-o ou substitui o texto no ficheiro <strong>dados.js</strong>.</p><h2>Estrutura sugerida</h2><ul><li>Contexto: o jogo, a equipa ou o tema</li><li>Análise: o que aconteceu e porquê</li><li>Fontes: de onde vêm os dados</li></ul><blockquote>Confirma sempre resultados, datas e números numa fonte oficial antes de publicar.</blockquote>`,
      de: `<p>Dies ist ein Beispielbeitrag. Lösche ihn oder ersetze den Text in der Datei <strong>dados.js</strong>.</p><h2>Vorgeschlagene Struktur</h2><ul><li>Kontext: das Spiel, das Team oder das Thema</li><li>Analyse: was passiert ist und warum</li><li>Quellen: woher die Daten stammen</li></ul><blockquote>Prüfe Ergebnisse, Daten und Zahlen immer in einer offiziellen Quelle, bevor du veröffentlichst.</blockquote>`
    }
  },
  {
    id: "exemplo-segundo-post",
    date: "2026-10-14",
    image: "",
    title: {
      pt: "Exemplo: como adicionar um post novo",
      de: "Beispiel: so fügst du einen neuen Beitrag hinzu"
    },
    body: {
      pt: `<p>Copia um bloco <code>{ ... }</code> da lista, cola-o no início e muda o <strong>id</strong>, a <strong>data</strong>, o título e o texto. Separa os blocos com vírgula.</p><p>Para uma imagem, coloca o endereço no campo <strong>image</strong>. Sem imagem, o site mostra um fundo com as cores do blogue.</p>`,
      de: `<p>Kopiere einen Block <code>{ ... }</code> aus der Liste, füge ihn am Anfang ein und ändere <strong>id</strong>, <strong>date</strong>, Titel und Text. Trenne die Blöcke mit einem Komma.</p><p>Für ein Bild trage die Adresse im Feld <strong>image</strong> ein. Ohne Bild zeigt die Seite einen Hintergrund in den Farben des Blogs.</p>`
    }
  }
];
