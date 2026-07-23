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

  /* ---------- 4. História ---------- */
  /* Garrafa como elemento DENTRO da própria seção (.historia-garrafa, igual .produto-garrafa
     no SAPHIR): por ser filha da seção pinada ela fica presa junto, sem a compensação de
     scroll que fazia a garrafa "agarrar" na descida.
     toggleActions 'play none none reverse' = toca SOZINHA ao chegar (sem precisar rolar
     dentro da seção) e REBOBINA ao subir o scroll de volta. O pin segura a seção enquanto
     a timeline roda, garantindo que dê tempo de ver tudo. */
  /* durações enxutas: a timeline inteira fecha em ~2,5s, dentro do tempo que o pin segura
     a seção — assim dá pra ver tudo mesmo rolando rápido, e o rewind volta ligeiro */
  const tlHistoria = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .from(emChars('.historia-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.03, duration: 0.55 })
    .from('.historia-texto h3, .historia-texto p', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, '-=0.25')
    .from('.historia-marcos > *',
      { y: 40, autoAlpha: 0, scale: 0.9, stagger: 0.1, duration: 0.5, ease: 'back.out(1.4)' }, '-=0.25')
    /* garrafa entra com a gelatina, já no lugar dela (a seção está presa) */
    .fromTo('.historia-garrafa',
      { autoAlpha: 0, scaleX: 0.64, scaleY: 1.2, rotate: -15 },
      { autoAlpha: 1, scaleX: 1, scaleY: 1, rotate: -8, duration: 0.9, ease: 'power2.out', transformOrigin: 'bottom center' }, '-=0.15');

  ScrollTrigger.create({
    trigger: '.historia', start: 'top top', end: '+=130%', pin: true, anticipatePin: 1,
    /* play/reverse pela DIREÇÃO do scroll: descendo, a timeline toca sozinha (sem precisar
       rolar dentro da seção); subindo, ela rebobina na hora — e como a seção ainda está
       pinada na tela, o rewind fica visível. Com toggleActions o reverse só saía ao deixar
       a seção por cima, quando ela já estava saindo de vista (daí não dava pra ver) */
    onUpdate: (self) => (self.direction === 1 ? tlHistoria.play() : tlHistoria.reverse()),
    onLeaveBack: () => tlHistoria.reverse(), // continua rebobinando depois de sair por cima
  });

  /* ---------- 5. Prêmio ---------- */
  /* mesmo padrão da história: toca sozinha ao chegar e rebobina ao voltar. A garrafa DESCE
     de cima até o lugar dela ao lado da lata — como ela mora dentro do .premio (pinado), a
     descida é um transform simples, sem cálculo entre seções. Depois lata e rodapé. */
  const garrafaWrap = document.querySelector('.garrafa-wrap');
  const tlPremio = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .from(emChars('.premio-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.03, duration: 0.55 })
    .from('.premio-texto h3, .premio-texto p', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, '-=0.25')
    /* a garrafa desce e se endireita, sincronizada com o texto */
    .from(garrafaWrap,
      { y: () => -window.innerHeight * 0.55, autoAlpha: 0, rotate: -8, scale: 0.92, duration: 0.9, ease: 'power2.out' }, '-=0.35')
    .from('.premio-lata', { y: 90, autoAlpha: 0, scale: 0.8, duration: 0.6, ease: 'back.out(1.6)' }, '-=0.45')
    .from('.rodape .aviso', { y: 20, autoAlpha: 0, duration: 0.5 }, '-=0.2')
    .from('.rodape .logo-coca',
      { y: 20, autoAlpha: 0, scale: 0.85, duration: 0.6, ease: 'back.out(1.6)' }, '-=0.3');

  ScrollTrigger.create({
    trigger: '.premio', start: 'top top', end: '+=130%', pin: true, anticipatePin: 1,
    onUpdate: (self) => (self.direction === 1 ? tlPremio.play() : tlPremio.reverse()),
    onLeaveBack: () => tlPremio.reverse(),
  });

  /* cores — criadas DEPOIS dos pins acima, pra medirem as posições já com os espaçadores */
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

  /* recalcula tudo com os pins já criados, pra todos os start/end baterem com o layout final */
  ScrollTrigger.refresh();
}

/* espera as fontes carregarem (o SplitText mede errado sem elas) */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
else window.addEventListener('load', init);
// ponytail: SplitText não re-quebra em resize (posições podem sair do lugar ao girar o device);
// se precisar, trocar emChars() por SplitText com autoSplit + ScrollTrigger.refresh no resize.
