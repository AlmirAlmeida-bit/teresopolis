/* Therezópolis Session IPA — animações (GSAP + Lenis) */
gsap.registerPlugin(ScrollTrigger, SplitText);

/* mobile: a barra de endereço aparecendo/sumindo muda a altura da viewport e, sem isso,
   o ScrollTrigger dá refresh no meio do scroll — recalcula os pins e tudo "pula"/desalinha.
   ignoreMobileResize faz ele ignorar esse resize da UI do navegador */
ScrollTrigger.config({ ignoreMobileResize: true });

const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* quebra em palavras + letras (words evita quebra no meio da palavra) e devolve os chars */
const emChars = (alvo) =>
  new SplitText(alvo, { type: 'words,chars', wordsClass: 'word', charsClass: 'char' }).chars;

function init() {
  window.scrollTo(0, 0); // toda carga começa no topo (vídeo)

  /* Movimento reduzido: revela o conteúdo e para por aqui (sem scroll suave) */
  if (reduzido) {
    gsap.set(['.header .container > *', '.intro h1', '.sobre', '.scroll-hint'], { autoAlpha: 1 });
    gsap.set('.saphir', { autoAlpha: 0 }); // "SAPHIR" some pra não cobrir o texto do produto
    gsap.set('.video-scroll', { yPercent: 0, filter: 'none', visibility: 'visible' }); // sem queda: vídeo no lugar
    const v = document.querySelector('.video-scroll'); v.muted = true; v.play().catch(() => {});
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

  /* logo + palhaço: fade suave. Só ficam visíveis com o hero enquadrado (topo) ou na
     seção do prêmio (última). Cálculo direto por scroll — imune ao pin do .produto */
  const marca = gsap.utils.toArray('.header .container > *');
  const premio = document.querySelector('.premio');
  let marcaVisivel = true;
  const setMarca = (mostrar) => {
    if (mostrar === marcaVisivel) return;
    marcaVisivel = mostrar;
    gsap.to(marca, { autoAlpha: mostrar ? 1 : 0, duration: 0.5, ease: 'power2.out', overwrite: true });
  };

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: () => {
      const y = window.scrollY;
      const noTopo = y < window.innerHeight * 0.4;                       // hero enquadrado
      const naPremio = premio.getBoundingClientRect().top < window.innerHeight * 0.7; // última seção à vista
      setMarca(noTopo || naPremio);
    },
  });

  /* ---------- 1. Intro: entrada das letras (timeline + stagger) ---------- */
  gsap.timeline({
    scrollTrigger: { trigger: '.intro', start: 'top 70%' }, // dispara ao entrar em vista (intro agora é a 2ª seção)
    defaults: { ease: 'power3.out' },
  })
    .set('.intro h1', { autoAlpha: 1 }) // revela o <h1> (CSS o escondia); os chars entram um a um
    .fromTo(emChars('.intro h1'),
      { yPercent: 120, autoAlpha: 0, rotate: 8 },
      { yPercent: 0, autoAlpha: 1, rotate: 0, duration: 0.9, stagger: 0.04 });

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
      /* SOBRE só entra DEPOIS do SAPHIR ter saído (empilhados no mobile, senão os dois
         textos se sobrepõem verticalmente durante a troca) */
      .to('.sobre', { autoAlpha: 1, duration: 0.5, ease: 'power2.out' }, 0.6)
      .from('.sobre .descricao > *, .sobre .combinacao > *',
        { y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out' }, '<0.1');
  });

  /* ---------- 1. Vídeo (topo): cai com repique na carga e dá autoplay — SEM pin/trava ---------- */
  const vid = document.querySelector('.video-scroll');
  vid.pause();
  vid.loop = true; // vídeo de topo: fica sempre vivo
  const videoChars = emChars('.content-video h2');
  gsap.set(videoChars, { autoAlpha: 0 });
  gsap.set(vid, { yPercent: -110, filter: 'blur(12px)', scale: 1.03, visibility: 'visible' }); // acima da tela; 3% de sangria cobre folga de viewport

  gsap.timeline({ delay: 0.15 })
    /* queda com repique até bater no chão */
    .fromTo(vid,
      { yPercent: -110, filter: 'blur(12px)' },
      { yPercent: 0, duration: 1.15, ease: 'bounce.out' })
    /* bateu no chão -> foca, dá play e revela o título */
    .to(vid, {
      filter: 'blur(0px)', duration: 0.4, ease: 'power2.out',
      onStart: () => {
        const p = vid.play();
        if (p) p.catch(() => {}); // autoplay é permitido pois o vídeo é muted
      },
    })
    .fromTo(videoChars,
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, stagger: 0.03, duration: 0.5, ease: 'power2.out' }, '<')
    /* "Role e descubra" só entra depois do título estar todo no lugar */
    .fromTo('.scroll-hint',
      { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' });

  /* ---------- 4. História + 5. Prêmio: textos, garrafa (gelatina) e a descida ao prêmio ---------- */
  const garrafaWrap = document.querySelector('.garrafa-wrap'); // recebe posição/escala/rotação
  const garrafaImg = document.querySelector('.premio-garrafa'); // recebe a gelatina
  const secHistoria = document.querySelector('.historia');
  gsap.set(garrafaImg, { autoAlpha: 0 }); // escondida até ser revelada no pin da história

  /* posição natural no documento via offsets — imune a transform e a scroll */
  const posDoc = (el) => {
    let x = 0, y = 0, n = el;
    while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  /* deslocamento garrafa (que mora no .premio) -> ponto dela na história. Recalculado no
     'refresh' do GSAP: só aí o layout está pronto (espaçadores dos pins criados) e nenhuma
     seção está pinada (position:fixed quebraria a cadeia de offsetTop). Valores em variáveis
     e lidos por função nos tweens => o GSAP reavalia sozinho a cada refresh */
  let dx = 0, dy = 0;
  const recalc = () => {
    const g = posDoc(garrafaWrap), h = posDoc(secHistoria);
    const mob = matchMedia('(max-width: 768px)').matches;
    const fx = mob ? 0.73 : 0.66; /* mobile: perto dos marcos, com respiro e sem sair da tela */
    const fy = mob ? 0.75 : 0.48;
    dx = (h.x + h.w * fx) - (g.x + g.w / 2);
    dy = (h.y + h.h * fy) - (g.y + g.h / 2);
  };
  recalc();
  ScrollTrigger.addEventListener('refresh', recalc);

  /* HISTÓRIA — pin + scrub (mesmo padrão da session ipa): texto -> marcos -> garrafa (gelatina).
     Durante o pin, o .premio (onde a garrafa mora) fica seguro ABAIXO da tela, então a garrafa
     deslocada por (dx,dy) fica paradinha no ponto da história enquanto a gelatina a revela.
     Criado ANTES das transições de cor: o GSAP resolve os start/end na ordem de criação, e o
     que vem depois já mede o .premio contando o espaço reservado por este pin */
  gsap.timeline({
    scrollTrigger: { trigger: '.historia', start: 'top top', end: '+=130%', pin: true, anticipatePin: 1, toggleActions: 'play none none reverse' },
    defaults: { ease: 'power3.out' },
  })
    .from(emChars('.historia-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.05, duration: 0.7 })
    .from('.historia-texto h3, .historia-texto p', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.6 }, '-=0.3')
    .from('.historia-marcos > *',
      { y: 40, autoAlpha: 0, scale: 0.9, stagger: 0.15, duration: 0.6, ease: 'back.out(1.4)' }, '-=0.3')
    .fromTo(garrafaImg,
      { autoAlpha: 0, scaleX: 0.64, scaleY: 1.2 },
      { autoAlpha: 1, scaleX: 1, scaleY: 1, duration: 1.3, ease: 'elastic.out(0.5, 0.62)', transformOrigin: 'bottom center' }, '-=0.1');

  /* amarelo (session ipa) TRANSFORMA no azul-claro da história, .sobre + .historia juntas */
  gsap.fromTo(['.sobre', '.historia'],
    { backgroundColor: '#E9C23A' },
    { backgroundColor: '#A1D2CE', ease: 'none',
      scrollTrigger: { trigger: '.historia', start: 'top bottom', end: 'top top', scrub: true } });

  /* azul-claro (história) TRANSFORMA no amarelo do prêmio, .historia + .premio juntas */
  gsap.fromTo(['.historia', '.premio'],
    { backgroundColor: '#A1D2CE' },
    { backgroundColor: '#E9C23A', ease: 'none',
      scrollTrigger: { trigger: '.premio', start: 'top bottom', end: 'top top', scrub: true } });

  /* GARRAFA — fica PARADA no ponto da história durante o pin. Como ela não está pinada (mora
     no .premio), sem isso ela rolaria pra cima e sairia de vista enquanto a história fica fixa.
     A compensação é um scrub linear: y sobe exatamente o tanto que o scroll anda no pin (1.3vh),
     mantendo a garrafa visualmente imóvel. Tudo por função => reavalia no refresh */
  const pinPx = () => window.innerHeight * 1.3; // = end '+=130%' do pin da história
  gsap.fromTo(garrafaWrap,
    { x: () => dx, y: () => dy, rotate: -15, scale: 0.92 },
    { x: () => dx, y: () => dy + pinPx(), rotate: -15, scale: 0.92, ease: 'none',
      scrollTrigger: { trigger: '.historia', start: 'top top', end: '+=130%', scrub: true } });

  /* GARRAFA -> PRÊMIO: DESCE do ponto da história até o lugar dela ao lado da lata (0,0),
     amarrada ao scroll enquanto o prêmio entra. Começa exatamente onde a compensação parou
     ('.premio top bottom' == fim do pin da história), sem sobreposição. immediateRender:false
     pra não sobrescrever a compensação durante o pin */
  gsap.fromTo(garrafaWrap,
    { x: () => dx, y: () => dy + pinPx(), rotate: -15, scale: 0.92 },
    { x: 0, y: 0, rotate: 0, scale: 1, ease: 'none', immediateRender: false,
      scrollTrigger: { trigger: '.premio', start: 'top bottom', end: 'top 30%', scrub: 1 } });

  /* PRÊMIO — textos carregam quando o scroll chega (one-shot), sincronizados com a garrafa
     descendo; depois a lata, e por fim o rodapé (aviso -> logo coca) */
  gsap.timeline({ scrollTrigger: { trigger: '.premio', start: 'top 55%' }, defaults: { ease: 'power3.out' } })
    .from(emChars('.premio-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.05, duration: 0.7 })
    .from('.premio-texto h3, .premio-texto p', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.6 }, '-=0.3')
    .from('.premio-lata', { y: 90, autoAlpha: 0, scale: 0.8, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.4')
    .from('.rodape .aviso', { y: 20, autoAlpha: 0, duration: 0.6 }, '+=0.2')
    .from('.rodape .logo-coca',
      { y: 20, autoAlpha: 0, scale: 0.85, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.35');

  /* recalcula tudo com os pins já criados, pra todos os start/end baterem com o layout final */
  ScrollTrigger.refresh();
}

/* espera as fontes carregarem (o SplitText mede errado sem elas) */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
else window.addEventListener('load', init);
// ponytail: SplitText não re-quebra em resize (posições podem sair do lugar ao girar o device);
// se precisar, trocar emChars() por SplitText com autoSplit + ScrollTrigger.refresh no resize.
