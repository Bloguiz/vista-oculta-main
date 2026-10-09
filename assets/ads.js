(() => {
  const ads = [
    {
      href: 'https://tracking.888africa.com/visit/?bta=48063&nci=5483',
      image: 'https://888africa.ck-cdn.com/tn/serve/?cid=772959',
      width: 360,
      height: 240
    },
    {
      href: 'https://tracking.888africa.com/visit/?bta=48063&nci=5522',
      image: 'https://888africa.ck-cdn.com/tn/serve/?cid=772957',
      width: 360,
      height: 240
    },
    {
      href: 'https://tracking.888africa.com/visit/?bta=48063&nci=5474',
      image: 'https://888africa.ck-cdn.com/tn/serve/?cid=772961',
      width: 300,
      height: 250
    },
    {
      href: 'https://tracking.888africa.com/visit/?bta=48063&nci=5458',
      image: 'https://888africa.ck-cdn.com/tn/serve/?cid=772963',
      landingPage: true
    },
    {
      href: 'https://tracking.888africa.com/visit/?bta=48063&nci=5449',
      image: 'https://888africa.ck-cdn.com/tn/serve/?cid=772964',
      landingPage: true
    }
  ];

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/assets/ads.css';
  document.head.append(stylesheet);

  const section = document.createElement('section');
  section.className = 'affiliate-ads';
  section.setAttribute('aria-label', 'Publicidade');

  const title = document.createElement('h2');
  title.className = 'affiliate-ads__title';
  title.textContent = 'Publicidade';
  section.append(title);

  const grid = document.createElement('div');
  grid.className = 'affiliate-ads__grid';

  ads.forEach((ad) => {
    const item = document.createElement('div');
    item.className = 'affiliate-ads__item';

    const link = document.createElement('a');
    link.href = ad.href;
    link.target = ad.landingPage ? '_blank' : '_top';
    if (ad.landingPage) link.rel = 'noopener';

    const image = document.createElement('img');
    image.src = ad.image;
    image.alt = 'Anúncio 888Africa';
    image.loading = 'lazy';
    if (ad.width) image.width = ad.width;
    if (ad.height) image.height = ad.height;
    link.append(image);
    item.append(link);

    if (ad.landingPage) {
      const caption = document.createElement('p');
      caption.className = 'affiliate-ads__caption';
      caption.append('Landing Page: ');
      const landingLink = document.createElement('a');
      landingLink.href = ad.href;
      landingLink.target = '_top';
      landingLink.textContent = ad.href;
      caption.append(landingLink);
      item.append(caption);
    }

    grid.append(item);
  });

  section.append(grid);
  const footer = document.querySelector('footer');
  if (footer) footer.before(section);
  else document.body.append(section);
})();