/* Therezópolis Session IPA — animações (GSAP + Lenis) */
gsap.registerPlugin(ScrollTrigger, SplitText);

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* quebra em palavras + letras (words evita quebra no meio da palavra) e devolve os chars */
const emChars = (alvo) =>
  new SplitText(alvo, { type: 'words,chars', wordsClass: 'word', charsClass: 'char' }).chars;

function init() {
  window.scrollTo(0, 0); // toda carga começa no hero

  /* Movimento reduzido: revela o conteúdo e para por aqui (sem scroll suave) */
  if (reduzido) {
    gsap.set(['.header .container > *', '.intro h1', '.intro span', '.sobre'], { autoAlpha: 1 });
    gsap.set('.saphir', { autoAlpha: 0 }); // "SAPHIR" some pra não cobrir o texto do produto
    return;
  }

  /* ---------- Lenis: scroll suave amarrado ao ticker do GSAP ---------- */
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.scrollTo(0, { immediate: true, force: true }); // sincroniza o Lenis no topo

  /* ---------- Header ---------- */
  gsap.fromTo('.header .container > *',
    { y: -30, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.2 });

  /* ---------- 1. Intro: entrada das letras (timeline + stagger) ---------- */
  /* bob (yoyo) da "Role e descubra": sobe e desce 10px, começa após a entrada */
  const bob = gsap.to('.intro span', {
    y: -10, duration: 0.75, ease: 'sine.inOut', repeat: -1, yoyo: true, paused: true,
  });

  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .set('.intro h1', { autoAlpha: 1 }) // revela o <h1> (CSS o escondia); os chars entram um a um
    .fromTo(emChars('.intro h1'),
      { yPercent: 120, autoAlpha: 0, rotate: 8 },
      { yPercent: 0, autoAlpha: 1, rotate: 0, duration: 0.9, stagger: 0.04 })
    .fromTo('.intro span',
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6 }, '-=0.35')
    .call(() => { if (lenis.scroll <= 2) bob.restart(); }); // liga o bob ao fim da entrada

  /* para ao rolar e RECARREGA o yoyo ao voltar pro topo */
  ScrollTrigger.create({
    trigger: '.intro',
    start: 'top top',
    end: '+=2',
    onLeave: () => { bob.pause(); gsap.set('.intro span', { y: 0 }); },
    onEnterBack: () => bob.restart(),
  });

  /* leve parallax do conteúdo da intro */
  gsap.to('.intro .container', {
    yPercent: 40, ease: 'none',
    scrollTrigger: { trigger: '.intro', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ---------- 2. Produto: coreografia por breakpoint (garrafa + SAPHIR → SOBRE) ---------- */
  const mm = gsap.matchMedia();
  const saphirChars = emChars('.saphir h2');

  /* DESKTOP: pin + timeline mestre — a garrafa atravessa SAPHIR → SOBRE */
  mm.add('(min-width: 769px)', () => {
    gsap.timeline({
      scrollTrigger: { trigger: '.produto', start: 'top top', end: '+=220%', scrub: 1, pin: true, anticipatePin: 1 },
    })
      /* A — garrafa e "SAPHIR" entram juntos */
      .from('.garrafa', { autoAlpha: 0, scale: 0.4, rotate: -25, duration: 0.6, ease: 'power2.out' })
      .from(saphirChars, { yPercent: 110, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out' }, '<')
      .to('.garrafa', { scale: 1.15, rotate: 18, duration: 0.6, ease: 'power1.inOut' })
      /* B — "SAPHIR" sai por cima; a garrafa se endireita (rotate 0) e para no centro */
      .to(saphirChars, { yPercent: -130, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: 'power2.in' })
      .to('.garrafa', { rotate: 0, scale: 1, duration: 0.9, ease: 'power2.inOut' }, '<')
      /* C — seção "sobre": garrafa em pé, parada entre "session ipa" e "Combina com:" */
      .to('.sobre', { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, '<0.15')
      .from('.sobre .descricao > *, .sobre .combinacao > *',
        { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out' }, '<0.1');
  });

  /* MOBILE: entrada ANTES do pin (evita ver a seção vazia) + pin com a travessia vertical */
  mm.add('(max-width: 768px)', () => {
    /* A — entrada: garrafa e SAPHIR entram enquanto a seção ainda está subindo,
       assim uma rolada já traz a animação (sem o vazio verde) */
    gsap.timeline({
      scrollTrigger: { trigger: '.produto', start: 'top 76%', end: 'top 30%', scrub: 1 },
    })
      /* ease 'none' + duração cheia: a animação acompanha o scroll em vez de
         terminar nos primeiros 20% (quando a garrafa ainda está fora da tela) */
      .fromTo('.garrafa',
        { autoAlpha: 0, scale: 0.5, rotate: -25, y: 0 },
        { autoAlpha: 1, scale: 1.1, rotate: 10, y: 0, duration: 1, ease: 'none' }, 0)
      .from(saphirChars,
        { yPercent: 110, autoAlpha: 0, stagger: 0.1, duration: 0.5, ease: 'none' }, 0);

    /* B/C — pin: "SAPHIR" sai por cima, garrafa desce e cresce, SOBRE (amarelo) aparece */
    gsap.timeline({
      scrollTrigger: { trigger: '.produto', start: 'top top', end: '+=150%', scrub: 1, pin: true, anticipatePin: 1 },
    })
      .to(saphirChars, { yPercent: -130, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: 'power2.in' })
      .to('.garrafa', { y: 141, scale: 1.28, rotate: 0, duration: 0.9, ease: 'power2.inOut' }, '<')
      .to('.sobre', { autoAlpha: 1, duration: 0.6, ease: 'power2.out' }, '<0.2')
      .from('.sobre .descricao > *, .sobre .combinacao > *',
        { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out' }, '<0.1');
  });

  /* ---------- 3. Vídeo: cai (repique), bate no chão e dá autoplay; solta pro prêmio no fim ---------- */
  const vid = document.querySelector('.video-scroll');
  vid.pause();
  const videoChars = emChars('.content-video h2');
  gsap.set(videoChars, { autoAlpha: 0 });
  gsap.set(vid, { yPercent: -110, filter: 'blur(12px)', scale: 1.03 }); // acima da tela; 3% de sangria cobre folga de viewport
  let liberado = false;
  let travaSeguranca;

  const liberar = () => {   // solta o scroll e rola sozinho até a seção da história
    if (liberado) return;
    liberado = true;
    clearTimeout(travaSeguranca);
    lenis.start();
    lenis.scrollTo('.historia', { duration: 1.6 });
  };
  vid.addEventListener('ended', liberar);
  vid.addEventListener('error', liberar);

  const cairEtocar = () => {   // vídeo cai, bate no chão e SÓ ENTÃO dá play
    liberado = false;
    clearTimeout(travaSeguranca);
    lenis.stop();            // trava o scroll durante a queda + reprodução
    vid.pause();
    vid.currentTime = 0;
    gsap.set(videoChars, { autoAlpha: 0 });
    gsap.timeline()
      /* queda com repique até bater no chão */
      .fromTo(vid,
        { yPercent: -110, filter: 'blur(12px)' },
        { yPercent: 0, duration: 1.15, ease: 'bounce.out' })
      /* fundo transiciona do amarelo (sobre) p/ a cor da história/prêmio, junto com a queda */
      .fromTo('.section-video',
        { backgroundColor: '#E9C23A' },
        { backgroundColor: '#A1D2CE', duration: 1.15, ease: 'power1.inOut' }, 0)
      /* bateu no chão -> foca, dá play e revela o título */
      .to(vid, {
        filter: 'blur(0px)', duration: 0.4, ease: 'power2.out',
        onStart: () => {
          const p = vid.play();
          if (p) p.catch(() => {}); // autoplay é permitido pois o vídeo é muted
          travaSeguranca = setTimeout(liberar, ((vid.duration || 15) + 1) * 1000); // trava de segurança
        },
      })
      .fromTo(videoChars,
        { yPercent: 100, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, stagger: 0.03, duration: 0.5, ease: 'power2.out' }, '<');
  };

  const esconderVideo = () => {   // vídeo saiu de vista subindo: volta pro estado "escondido acima"
    clearTimeout(travaSeguranca);
    gsap.killTweensOf(vid);
    gsap.killTweensOf(videoChars);
    vid.pause();
    vid.currentTime = 0;
    gsap.set(vid, { yPercent: -110, filter: 'blur(12px)', scale: 1.03 });
    gsap.set(videoChars, { autoAlpha: 0 });
    gsap.set('.section-video', { backgroundColor: '#E9C23A' }); // volta o fundo pro amarelo p/ a próxima queda
  };

  ScrollTrigger.create({
    trigger: '.section-video',
    start: 'top top',
    /* folga no pin: a inércia do Lenis para alguns px além do início, e com um pin
       de 1px a seção despinava e ficava desalinhada (faixa em cima/embaixo).
       Com essa folga ela continua pinada = colada na viewport, sem gap. */
    end: '+=200',
    pin: true,
    onEnter: cairEtocar,   // desceu até o vídeo: cai e toca do zero
  });

  /* subindo: mantém o vídeo estático em vista e só o esconde quando ele sai TOTALMENTE por baixo
     (já na altura do "session ipa") — assim nunca se vê a seção do vídeo vazia */
  ScrollTrigger.create({
    trigger: '.section-video',
    start: 'top bottom',
    onLeaveBack: esconderVideo,
  });

  /* ---------- 4. História: entrada no mesmo estilo (letras em stagger + textos + marcos) ---------- */
  const garrafaWrap = document.querySelector('.garrafa-wrap'); // recebe posição/escala/rotação
  const garrafaImg = document.querySelector('.premio-garrafa'); // recebe a gelatina
  const secHistoria = document.querySelector('.historia');
  gsap.set(garrafaImg, { autoAlpha: 0 }); // escondida até chegar a vez dela

  gsap.timeline({ scrollTrigger: { trigger: '.historia', start: 'top 65%' }, defaults: { ease: 'power3.out' } })
    .from(emChars('.historia-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.05, duration: 0.7 })
    .from('.historia-texto h3, .historia-texto p', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.6 }, '-=0.3')
    .from('.historia-marcos > *',
      { y: 40, autoAlpha: 0, scale: 0.9, stagger: 0.15, duration: 0.6, ease: 'back.out(1.4)' }, '-=0.35')
    /* só DEPOIS do texto a garrafa entra, com gelatina */
    .fromTo(garrafaImg,
      { autoAlpha: 0, scaleX: 0.45, scaleY: 1.55 },
      { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 1.3, ease: 'elastic.out(1, 0.35)' }, '+=0.15');

  /* ---------- 5. Prêmio: timeline de entrada (letras + textos + produtos) ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.premio', start: 'top 65%' }, defaults: { ease: 'power3.out' } })
    .from(emChars('.premio-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.05, duration: 0.7 })
    .from('.premio-texto h3, .premio-texto p', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.6 }, '-=0.3')
    .from('.premio-lata', { y: 90, autoAlpha: 0, scale: 0.8, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.4')
    /* rodapé entra por último: aviso e, na outra ponta, o logo com um pop */
    .from('.rodape .aviso', { y: 20, autoAlpha: 0, duration: 0.6 }, '+=0.2')
    .from('.rodape .logo-coca',
      { y: 20, autoAlpha: 0, scale: 0.85, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.35');

  /* ---------- 6. Garrafa: viaja da história até o lugar dela no prêmio ---------- */
  /* posição natural no documento via offsets — não é afetada por transform nem por scroll */
  const posDoc = (el) => {
    let x = 0, y = 0, n = el;
    while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  /* deslocamento até o ponto da história: no desktop o vão entre texto e marcos;
     no mobile (coluna) a área livre abaixo dos marcos, p/ não cobrir o texto */
  const desloc = () => {
    const g = posDoc(garrafaWrap), h = posDoc(secHistoria);
    const mob = matchMedia('(max-width: 768px)').matches;
    const fx = mob ? 0.73 : 0.66; /* mobile: perto dos marcos, com respiro e sem sair da tela */
    const fy = mob ? 0.75 : 0.48;
    return {
      x: (h.x + h.w * fx) - (g.x + g.w / 2),
      y: (h.y + h.h * fy) - (g.y + g.h / 2),
    };
  };

  /* viaja da história até o lugar no prêmio: sai inclinada p/ a esquerda e menor,
     endireita e cresce gradualmente no caminho */
  gsap.fromTo(garrafaWrap,
    { x: () => desloc().x, y: () => desloc().y, rotate: -15, scale: 0.92 },
    {
      x: 0, y: 0, scale: 1, rotate: 0, ease: 'none',
      /* fecha ANTES do prêmio se assentar (a entrada dos textos é em 'top 65%'), pra garrafa
         já estar alinhada com a lata quando você olha a seção */
      /* começa só depois de rolar um pouco na história (antes ela saía no primeiro toque)
         e percorre um trecho bem maior, com scrub suavizado */
      scrollTrigger: { trigger: '.premio', start: 'top bottom-=250', end: 'top 25%', scrub: 1 },
    });
}

/* espera as fontes carregarem (o SplitText mede errado sem elas) */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
else window.addEventListener('load', init);
// ponytail: SplitText não re-quebra em resize (posições podem sair do lugar ao girar o device);
// se precisar, trocar emChars() por SplitText com autoSplit + ScrollTrigger.refresh no resize.
