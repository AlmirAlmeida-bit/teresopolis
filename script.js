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

  /* MOBILE: sem pin — SAPHIR e SOBRE empilham em fluxo normal, reveals simples ao entrar */
  mm.add('(max-width: 768px)', () => {
    gsap.set('.sobre', { autoAlpha: 1 }); // aparece em fluxo normal (o CSS a escondia p/ o desktop)
    gsap.from('.garrafa', {
      autoAlpha: 0, scale: 0.6, y: -20, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: '.saphir', start: 'top 75%' },
    });
    gsap.from(saphirChars, {
      yPercent: 110, autoAlpha: 0, stagger: 0.05, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.saphir', start: 'top 60%' },
    });
    gsap.from('.sobre .descricao > *, .sobre .combinacao > *', {
      y: 30, autoAlpha: 0, stagger: 0.06, duration: 0.6, ease: 'power2.out',
      scrollTrigger: { trigger: '.sobre', start: 'top 75%' },
    });
  });

  /* ---------- 3. Vídeo: cresce de 55%->100% da largura no scroll; em 100% trava e toca ---------- */
  const vid = document.querySelector('.video-scroll');
  vid.pause();
  const videoChars = emChars('.content-video h2');
  gsap.set(videoChars, { autoAlpha: 0 }); // título escondido durante o crescimento
  let liberado = false;
  let travado = false;
  let travaSeguranca;

  const liberar = () => {   // solta o scroll e rola sozinho até a última seção
    if (liberado) return;
    liberado = true;
    clearTimeout(travaSeguranca);
    lenis.start();
    lenis.scrollTo('.premio', { duration: 1.6 });
  };
  vid.addEventListener('ended', liberar);
  vid.addEventListener('error', liberar);

  const tocarVideo = () => {   // vídeo em 100%: trava o scroll e toca do zero
    gsap.set(vid, { width: '100%' }); // garante largura cheia
    liberado = false;
    clearTimeout(travaSeguranca);
    lenis.stop();            // trava o scroll (html recebe overflow:clip via .lenis-stopped)
    vid.pause();
    vid.currentTime = 0;
    gsap.fromTo(videoChars,
      { yPercent: 100, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, stagger: 0.03, duration: 0.6, ease: 'power2.out' });
    /* efeito de entrada: blur -> nítido; só depois começa o autoplay */
    gsap.fromTo(vid,
      { filter: 'blur(24px)' },
      {
        filter: 'blur(0px)', duration: 1.4, ease: 'power2.out',
        onComplete: () => {
          const p = vid.play();
          if (p) p.catch(() => {}); // autoplay é permitido pois o vídeo é muted
          travaSeguranca = setTimeout(liberar, ((vid.duration || 15) + 1) * 1000); // trava de segurança se 'ended' falhar
        },
      });
  };

  /* pin + scrub: a largura cresce até 100% (progress ~0..0.85) e segura; trava dentro do hold */
  const cresce = gsap.timeline()
    .fromTo(vid, { width: '55%' }, { width: '100%', ease: 'none', duration: 0.85 })
    .to({}, { duration: 0.15 }); // segura em 100% antes de travar (evita o scrub voltar p/ 99%)

  ScrollTrigger.create({
    trigger: '.section-video',
    start: 'top top',
    end: '+=100%',
    scrub: true,
    pin: true,
    animation: cresce,
    onEnter: () => { travado = false; gsap.set(videoChars, { autoAlpha: 0 }); }, // novo ciclo
    onEnterBack: () => { gsap.set(videoChars, { autoAlpha: 0 }); },
    onUpdate: (self) => {
      if (!travado && self.progress >= 0.9) { travado = true; tocarVideo(); }
    },
  });

  /* ---------- 4. Prêmio: timeline de entrada (letras + textos + produtos) ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.premio', start: 'top 65%' }, defaults: { ease: 'power3.out' } })
    .from(emChars('.premio-texto h2'), { yPercent: 100, autoAlpha: 0, stagger: 0.05, duration: 0.7 })
    .from('.premio-texto h3, .premio-texto p', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.6 }, '-=0.3')
    .from('.premio-produtos img', { y: 90, autoAlpha: 0, scale: 0.8, stagger: 0.18, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.4');
}

/* espera as fontes carregarem (o SplitText mede errado sem elas) */
if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
else window.addEventListener('load', init);
// ponytail: SplitText não re-quebra em resize (posições podem sair do lugar ao girar o device);
// se precisar, trocar emChars() por SplitText com autoSplit + ScrollTrigger.refresh no resize.
