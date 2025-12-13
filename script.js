
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getAuth, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, push, remove, onValue, update, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
        
        window.firebaseModules = { initializeApp, getAuth, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signOut, updateProfile, getDatabase, ref, set, get, push, remove, onValue, update,runTransaction };
   
   

const firebaseConfig = {
  apiKey: "AIzaSyCO1IIYJ8T2ksWDnu_DisIZ0KXkhn2gh3w",
  authDomain: "data-client-3-2be69.firebaseapp.com",
  databaseURL: "https://data-client-3-2be69-default-rtdb.firebaseio.com",
  projectId: "data-client-3-2be69",
  storageBucket: "data-client-3-2be69.firebasestorage.app",
  messagingSenderId: "953517130591",
  appId: "1:953517130591:web:e31f9755daaa255c92ecea",
  measurementId: "G-Z1ZES6C86S"
};
        
        let app;
        try { app = initializeApp(firebaseConfig); } catch(e){ app = firebase.app(); }
        const auth = getAuth(app);
        const db = getDatabase(app);

        let PRODUCTS = []; 
        let CATEGORIES = [];
        let BANNER_DATA = null;
        let VACATION_SETTINGS = null; // <--- AGREGAR ESTO
        let bannerInterval = null;
        let POPUP_LINK = '';
        let SERVICES_DATA = null;

// --- PEGA ESTO EN SU LUGAR ---


// LISTENER DE SERVICIOS (ACTUALIZADO)
onValue(ref(db, 'content/services_page'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        SERVICES_DATA = data; // Actualizamos variable global

        // Lógica para mostrar/ocultar menú (igual que antes)
        const desktopMenu = document.getElementById('menu-item-services');
        const mobileMenu = document.getElementById('mobile-link-services');
        
        if (data.enabled) {
            if(desktopMenu) desktopMenu.classList.remove('hidden');
            if(mobileMenu) mobileMenu.classList.remove('hidden', 'flex');
            if(mobileMenu) mobileMenu.classList.add('flex');
        } else {
            if(desktopMenu) desktopMenu.classList.add('hidden');
            if(mobileMenu) mobileMenu.classList.add('hidden');
            
            // Redirección si está deshabilitado y el usuario está ahí
            const params = new URLSearchParams(window.location.search);
            if (params.get('page') === 'services') router.navigate('/');
        }
        
        // Refrescar si estamos en la página
        const params = new URLSearchParams(window.location.search);
        if (params.get('page') === 'services') {
            router.handle(false);
        }
    }
});

        // CARGA SEGURA DE PRODUCTOS
        onValue(ref(db, 'products'), (snapshot) => {
            if (snapshot.exists()) {
                const allData = Object.values(snapshot.val());
                
                // PROTECCIÓN TOTAL:
                // 1. (p && p.id && p.name) -> Evita que productos vacíos rompan la página (Igual que en tu Admin)
                // 2. (p.isVisible !== false) -> Respeta tu botón de ocultar/mostrar
                PRODUCTS = allData.filter(p => p && p.id && p.name && p.isVisible !== false);
                
                // Forzar actualización de la vista actual
                router.handle(false); // false para no scrollear arriba cada vez que alguien compra algo
            } else { 
                PRODUCTS = []; 
                router.handle(false); 
            }
        });

        // CARGA SEGURA DE CATEGORÍAS (Con auto-refresco del menú)
        onValue(ref(db, 'categories'), (snapshot) => {
            if (snapshot.exists()) {
                const rawCats = Object.values(snapshot.val());
                
                // Ordenar: Primero fijadas, luego alfabético
                CATEGORIES = rawCats.filter(c => c && c.name).sort((a, b) => {
                    if (a.isPinned && !b.isPinned) return -1;
                    if (!a.isPinned && b.isPinned) return 1;
                    return a.name.localeCompare(b.name);
                });
                
                // MÁGIA: Si el Mega Menú ya se dibujó, lo obligamos a repintarse
                if(window.megaMenuManager && typeof window.megaMenuManager.refresh === 'function') {
                    window.megaMenuManager.refresh();
                }
                
                router.handle(false);
            } else { 
                CATEGORIES = []; 
                if(window.megaMenuManager && typeof window.megaMenuManager.refresh === 'function') {
                    window.megaMenuManager.refresh();
                }
                router.handle(false); 
            }
        });


// --- LISTENER DE POPUP PUBLICITARIO (ADAPTADO CON TEXTOS) ---
onValue(ref(db, 'settings/popup_ad'), (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        
        // 1. Verificar si está activo y tiene imagen
        if (!data.isActive || !data.image) return;

        // 2. Verificar fechas
        const now = new Date();
        now.setHours(0,0,0,0);
        
        // Convertir strings YYYY-MM-DD a objetos Date
        const startParts = data.startDate.split('-');
        const endParts = data.endDate.split('-');
        const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
        const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

        if (now >= startDate && now <= endDate) {
            
            // 3. RETRASO INTELIGENTE (2.5 segundos)
            setTimeout(() => {
                // AQUÍ ESTÁ EL CAMBIO: Pasamos también title, message y btnText
                window.showAdPopup(
                    data.image, 
                    data.link, 
                    data.title, 
                    data.message, 
                    data.btnText
                );
            }, 2500); 
            
        }
    }
});


onValue(ref(db, 'categories'), (snapshot) => {
    if (snapshot.exists()) {
        const rawCats = Object.values(snapshot.val());
        
        CATEGORIES = rawCats.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return a.name.localeCompare(b.name);
        });
        
        // --- ESTA ES LA LÍNEA MÁGICA ---
        // Si el Mega Menú ya existe, le obligamos a actualizarse al instante
        if(window.megaMenuManager && typeof window.megaMenuManager.refresh === 'function') {
            window.megaMenuManager.refresh();
        }
        // -------------------------------
        
        router.handle();
    } else { 
        CATEGORIES = []; 
        
        // También actualizamos si se borraron todas las categorías
        if(window.megaMenuManager && typeof window.megaMenuManager.refresh === 'function') {
            window.megaMenuManager.refresh();
        }

        router.handle(); 
    }
});
        

// AGREGAR ESTE NUEVO onValue:
        onValue(ref(db, 'settings/vacation_mode'), (snapshot) => {
            if (snapshot.exists()) {
                VACATION_SETTINGS = snapshot.val();
                checkVacationPopup(); // Verificar si mostramos el popup al cargar o cambiar datos
            } else {
                VACATION_SETTINGS = null;
            }
        });


        onValue(ref(db, 'home_banner'), (snapshot) => {
            if (snapshot.exists()) {
                BANNER_DATA = snapshot.val();
                const params = new URLSearchParams(window.location.search);
                const currentPage = params.get('page') || 'home';
                if(currentPage === 'home') {
                    const app = document.getElementById('app');
                    renderHome(app);
                }
            }
        });

        const FAQS = [
            { q: "¿Realizan envíos a provincias?", a: "Sí, realizamos envíos a todo el Perú a través de Olva Courier y Shalom. El tiempo estimado es de 2 a 4 días hábiles." },
            { q: "¿Los productos tienen garantía?", a: "Todos nuestros productos cuentan con 12 meses de garantía oficial de marca por defectos de fábrica." },
            { q: "¿Tienen tienda física?", a: "Actualmente somos una tienda 100% online para ofrecerte los mejores precios, pero contamos con almacén en Huánuco para retiros." },
            { q: "¿Qué medios de pago aceptan?", a: "Aceptamos todas las tarjetas de crédito/débito, Yape, Plin y Transferencia Bancaria." }
        ];

        const state = { 
            cart: JSON.parse(localStorage.getItem('techPerú_cart')) || [], 
            user: null,
            favorites: new Set(), 
            orders: [],
            points: 0,
            wallet: 0
        };


// --- LÓGICA DE VACACIONES (SIEMPRE VISIBLE AL RECARGAR) ---

        // Función 1: Determina si HOY la tienda está cerrada (bloqueo real)
        window.isVacationActive = () => {
            if (!VACATION_SETTINGS || !VACATION_SETTINGS.isActive) return false;
            
            const now = new Date();
            now.setHours(0,0,0,0); // Normalizamos hoy a las 00:00

            const startParts = VACATION_SETTINGS.startDate.split('-');
            const endParts = VACATION_SETTINGS.endDate.split('-');
            
            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);
            
            // Si hoy está DENTRO del rango de vacaciones
            return now >= startDate && now <= endDate;
        };

        // Función 2: Muestra Popup de Bloqueo O Aviso de Anticipación
        window.checkVacationPopup = () => {
            if (!VACATION_SETTINGS || !VACATION_SETTINGS.isActive) return;

            const now = new Date();
            now.setHours(0,0,0,0);

            const startParts = VACATION_SETTINGS.startDate.split('-');
            const endParts = VACATION_SETTINGS.endDate.split('-');
            
            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

            // Calculamos la diferencia en días
            const diffTime = startDate - now;
            const daysUntilStart = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // ESCENARIO A: ESTAMOS EN VACACIONES (BLOQUEO TOTAL)
            if (now >= startDate && now <= endDate) {
                Swal.fire({
                    title: '🛑 Aviso Importante',
                    html: `<div class="text-center">
                            <i class="ph-fill ph-calendar-x text-5xl text-orange-500 mb-3"></i>
                            <p class="text-lg font-bold text-slate-700">${VACATION_SETTINGS.message}</p>
                            <p class="text-sm text-slate-500 mt-2">No procesaremos pedidos hasta el <b>${new Date(endDate).toLocaleDateString()}</b>.</p>
                           </div>`,
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#0f172a',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    backdrop: `rgba(0,0,123,0.4)`
                });
            }
            // ESCENARIO B: FALTAN 5 DÍAS O MENOS (AVISO PREVIO - SIEMPRE VISIBLE)
            else if (daysUntilStart > 0 && daysUntilStart <= 5) {
                // AQUÍ QUITAMOS EL IF DE SESSIONSTORAGE PARA QUE SALGA SIEMPRE
                Swal.fire({
                    title: '⚠️ Aviso de Vacaciones',
                    html: `<div class="text-left">
                            <p class="text-sm font-bold text-slate-700 mb-2">¡Anticipa tus compras!</p>
                            <p class="text-xs text-slate-600">Nuestra tienda entrará en pausa por vacaciones en <b>${daysUntilStart} día(s)</b>.</p>
                            <ul class="text-xs text-slate-500 mt-2 list-disc ml-4">
                                <li>Desde: <b>${startDate.toLocaleDateString()}</b></li>
                                <li>Hasta: <b>${endDate.toLocaleDateString()}</b></li>
                            </ul>
                            <p class="text-xs font-bold text-green-600 mt-2">✅ Aún puedes comprar hoy con normalidad.</p>
                           </div>`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    showCloseButton: true,
                    timer: 10000, // Se va solo en 10 segundos
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                });
            }
        };


        window.uiManager = {
            toggleMobileMenu: () => {
                const menu = document.getElementById('mobile-menu');
                const panel = document.getElementById('mobile-menu-panel');
                if (menu.classList.contains('hidden')) {
                    menu.classList.remove('hidden');
                    setTimeout(() => panel.classList.remove('-translate-x-full'), 10);
                } else {
                    panel.classList.add('-translate-x-full');
                    setTimeout(() => menu.classList.add('hidden'), 300);
                }
            },
            mobileNavigate: (path, params) => {
                uiManager.toggleMobileMenu();
                router.navigate(path, params);
            }
        };


window.userActions = {
            handleProfileClick: () => {
                if (state.user) router.navigate('/profile');
                else router.navigate('/login');
            },


// AGREGA ESTA NUEVA FUNCIÓN:
    handleAuthClick: () => {
        if (state.user) {
            router.navigate('/profile'); // Si ya ingresó, va al perfil
        } else {
            router.navigate('/login');   // Si no, va al login
        }
    },

            toggleFavorite: async (productId) => {
                if (!state.user) return Swal.fire('Inicia sesión', 'Debes ingresar para guardar favoritos', 'info');
                const dbRef = ref(db, `users/${state.user.uid}/favorites/${productId}`);
                if (state.favorites.has(productId)) {
                    await remove(dbRef);
                    Swal.fire({icon: 'success', title: 'Eliminado de favoritos', toast: true, position: 'bottom-end', timer: 1000, showConfirmButton: false});
                } else {
                    await set(dbRef, true);
                    Swal.fire({icon: 'success', title: 'Añadido a favoritos', toast: true, position: 'bottom-end', timer: 1000, showConfirmButton: false});
                }
            },
            redeemPoints: async () => {
                if (state.points < 100) return Swal.fire('Faltan Puntos', 'Necesitas mínimo 100 puntos para canjear.', 'info');
                
                const result = await Swal.fire({
                    title: '¿Canjear Puntos?',
                    text: "Canjea 100 Puntos por S/ 10.00 de saldo en tu monedero.",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, canjear',
                    confirmButtonColor: '#fbbf24', 
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    try {
                        Swal.showLoading();
                        const cost = 100;
                        const reward = 10; 
                        
                        const newPoints = state.points - cost;
                        const newWallet = state.wallet + reward;

                        const updates = {};
                        updates[`users/${state.user.uid}/points`] = newPoints;
                        updates[`users/${state.user.uid}/wallet`] = newWallet;

                        await update(ref(db), updates);
                        Swal.fire('¡Canje Exitoso!', `Tienes S/ ${reward}.00 más en tu monedero.`, 'success');
                    } catch(e) {
                        console.error(e);
                        Swal.fire('Error', 'No se pudo procesar el canje.', 'error');
                    }
                }
            },

downloadVoucher: (oid) => {
                // Buscamos el pedido en el historial cargado
                const order = state.orders.find(o => o.id === oid);
                if(order) {
                    checkoutManager.downloadPDF(order);
                } else {
                    Swal.fire('Error', 'No se encontraron los datos del pedido.', 'error');
                }
            },


checkout: () => {
                // --- BLOQUEO POR VACACIONES (Esto se queda igual) ---
                if (isVacationActive()) {
                    cartManager.toggleCart(); 
                    return Swal.fire({
                        title: 'Compras Pausadas',
                        html: `<div class="text-center">
                                <i class="ph-fill ph-calendar-x text-5xl text-orange-500 mb-3"></i>
                                <p class="font-bold text-lg mb-2">No estamos atendiendo pedidos temporalmente.</p>
                                <p class="bg-orange-50 p-3 rounded-lg border border-orange-100 text-orange-800 text-sm">${VACATION_SETTINGS.message}</p>
                                <p class="text-xs text-slate-400 mt-3">Podrás comprar nuevamente a partir del <b>${new Date(VACATION_SETTINGS.endDate).toLocaleDateString()}</b>.</p>
                               </div>`,
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#0f172a'
                    });
                }
                // ------------------------------

                if (state.cart.length === 0) return Swal.fire('Carrito Vacío', 'Agrega productos antes de pagar.', 'warning');
                
                // VALIDACIÓN DE LOGIN
                if (!state.user) {
                    cartManager.toggleCart();
                    Swal.fire({ title: 'Inicia sesión', text: 'Necesitamos tus datos para el pedido.', icon: 'info', confirmButtonText: 'Ir a Login', confirmButtonColor: '#0f172a' }).then(() => router.navigate('/login'));
                    return;
                }

                // --- AQUÍ ESTÁ EL CAMBIO PARA LA TRANSICIÓN ELEGANTE ---
                
                // 1. Primero cerramos el carrito (empieza la animación de salida)
                cartManager.toggleCart(); 
                
                // 2. Esperamos 300ms (el carrito ya se habrá movido un poco hacia afuera)
                // y entonces hacemos entrar el Checkout. Esto evita el golpe brusco.
                setTimeout(() => {
                    checkoutManager.open();   
                }, 300);
            },

showOrderDetails: (orderId) => {
                const order = state.orders.find(o => o.id === orderId);
                if (!order) return Swal.fire('Error', 'No se encontraron los datos del pedido.', 'error');

                const modal = document.getElementById('order-details-modal');
                const panel = document.getElementById('order-details-panel');
                const content = document.getElementById('order-details-content');
                
                // Verificar que el HTML del modal existe
                if(!modal || !panel || !content) return console.error("Falta el HTML del modal");

                document.getElementById('od-modal-id').innerText = `Pedido #${order.id.slice(-6)}`;

                // 1. Generar lista de productos (CON VARIANTES Y BOTÓN DE RESEÑA)
                const isApproved = order.status === 'Aprobado';
                
                const itemsHTML = (order.items || []).map(i => {
                    // --- AQUI ESTÁ LA MEJORA: DETECTAR VARIANTE ---
                    let variantInfo = '';
                    if (i.selectedResistance) {
                        variantInfo = `<div class="mt-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit flex items-center gap-1"><i class="ph-bold ph-lightning"></i> Resistencia: ${i.selectedResistance}</div>`;
                    } else if (i.selectedColor) {
                        variantInfo = `<div class="mt-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit flex items-center gap-1"><i class="ph-fill ph-palette"></i> Color: ${i.selectedColor}</div>`;
                    }
                    // ---------------------------------------------

                    // Botón de reseña solo si está aprobado
                    const reviewBtn = isApproved 
                        ? `<button onclick="router.navigate('product', {product: '${i.slug}'}); setTimeout(() => { document.getElementById('tab-btn-reviews').click(); document.getElementById('reviews-section').scrollIntoView({behavior: 'smooth'}); }, 800);" class="mt-3 w-full py-2.5 rounded-lg bg-cyan-50 border border-yellow-200 text-cyan-800 text-xs font-bold hover:bg-[#00979D] hover:text-slate-900 hover:border-[#00979D] transition flex items-center justify-center gap-2 shadow-sm group"><i class="ph-fill ph-star group-hover:animate-bounce"></i> Dejar Comentario</button>` 
                        : '';

                    return `
                    <div class="flex gap-4 py-4 border-b border-slate-100 last:border-0 bg-white p-3 rounded-xl mb-2 shadow-sm">
                        <img src="${i.image}" class="w-16 h-16 rounded-lg object-cover border border-slate-200 flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-sm text-slate-900 line-clamp-2 mb-1">${i.name}</h4>
                            
                            ${variantInfo} <div class="flex justify-between items-center mt-2">
                                <span class="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">${i.qty} unid.</span>
                                <span class="font-bold text-sm text-slate-900">S/ ${(i.qty * i.price).toFixed(2)}</span>
                            </div>
                            ${reviewBtn}
                        </div>
                    </div>`;
                }).join('');

                // 2. Verificar descuento Monedero
                let walletHTML = '';
                if(order.walletUsed && order.walletUsed > 0) {
                    walletHTML = `
                    <div class="flex justify-between items-center text-sm mb-2 px-2">
                        <span class="text-green-600 font-bold flex items-center gap-1"><i class="ph-fill ph-wallet"></i> Desc. Monedero</span>
                        <span class="text-green-600 font-bold">- S/ ${order.walletUsed.toFixed(2)}</span>
                    </div>`;
                }

                // 3. Renderizar todo el contenido
                content.innerHTML = `
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <div class="bg-blue-500 text-white rounded-full p-1 shrink-0"><i class="ph-fill ph-info text-lg"></i></div>
                        <div class="text-xs text-blue-800 flex-1">
                            <p class="font-bold mb-1 text-sm">Estado: ${order.status}</p>
                            <p>Fecha: ${new Date(order.date).toLocaleDateString()} a las ${new Date(order.date).toLocaleTimeString()}</p>
                            <p class="mt-1 opacity-75">Entrega en: ${order.billing.address}</p>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h3 class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider ml-1">Productos Comprados</h3>
                        <div class="space-y-2">${itemsHTML}</div>
                    </div>

                    <div class="mt-4">
                        <h3 class="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider ml-1">Resumen Financiero</h3>
                        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div class="flex justify-between items-center text-sm mb-2 text-slate-500 px-2">
                                <span>Subtotal</span>
                                <span>S/ ${(order.originalTotal || order.total).toFixed(2)}</span>
                            </div>
                            ${walletHTML}
                            <div class="border-t border-slate-100 my-3 pt-3 flex justify-between items-center px-2">
                                <span class="font-extrabold text-slate-900 text-lg">Total Pagado</span>
                                <span class="font-extrabold text-slate-900 text-lg">S/ ${order.total.toFixed(2)}</span>
                            </div>
                            <div class="mt-2 text-[10px] text-center text-slate-400 bg-slate-50 py-1 rounded">Método de Pago: ${order.payment.method}</div>
                        </div>
                    </div>
                `;

                modal.classList.remove('hidden');
                setTimeout(() => panel.classList.remove('translate-x-full'), 10);
            },

            closeOrderDetails: () => {
                const modal = document.getElementById('order-details-modal');
                const panel = document.getElementById('order-details-panel');
                if(modal && panel) {
                    panel.classList.add('translate-x-full');
                    setTimeout(() => modal.classList.add('hidden'), 300);
                }
            }
        };

        

window.checkoutManager = {



    // --- NUEVO: Cambiar input según Yape o Plin ---
            toggleWalletInput: () => {
                const type = document.querySelector('input[name="wallet_type"]:checked').value;
                const label = document.getElementById('payment-code-label');
                const input = document.getElementById('payment-code');

                input.value = ''; // Limpiamos lo que escribió

                if(type === 'Yape') {
                    // Configuración YAPE
                    label.innerText = 'Código de Aprobación (3 Dígitos) *';
                    input.setAttribute('maxlength', '3');
                    input.placeholder = '•••';
                    input.classList.add('tracking-[1em]', 'text-2xl'); // Letras separadas y grandes
                    input.classList.remove('tracking-widest', 'text-xl');
                } else {
                    // Configuración PLIN
                    label.innerText = 'Número de Operación (6-8 Dígitos) *';
                    input.setAttribute('maxlength', '12'); 
                    input.placeholder = '123456';
                    input.classList.remove('tracking-[1em]', 'text-2xl'); 
                    input.classList.add('tracking-widest', 'text-xl'); // Letras más juntas
                }
            },
            // -----------------------------------------------

// NUEVO: Función para volver al carrito desde el checkout
            backToCart: () => {
                checkoutManager.close();
                // Esperamos que termine la animación de cierre (300ms) y abrimos el carrito
                setTimeout(() => {
                    cartManager.toggleCart();
                }, 300);
            },




            // NUEVO: Navegación inteligente (Atrás en orden)
            goBack: () => {
                const paymentSec = document.getElementById('payment-section');
                
                // Si la sección de pago es visible, volvemos al formulario (Paso 1)
                if (!paymentSec.classList.contains('hidden')) {
                    checkoutManager.backToBilling();
                } 
                // Si estamos en el formulario, volvemos al carrito (Paso 0)
                else {
                    checkoutManager.backToCart();
                }
            },
    
            // --- DATOS TELEGRAM ---
            telegramToken: '8527181742:AAGwQ0F8bYBj0u5kDWV11nwE7YaM0SmBVGk', 
            telegramChatId: '-1003493508205',       
            
sendTelegramAlert: async (order) => {
                const oid = order.id ? order.id.slice(-6) : '---';
                
                // --- AQUI ESTÁ EL CAMBIO: Detectar variantes para Telegram ---
                const itemsList = order.items.map(i => {
                    let variantInfo = "";
                    
                    // Si es Color
                    if(i.selectedColor) {
                        variantInfo = ` (Color: ${i.selectedColor})`;
                    } 
                    // Si es Resistencia
                    else if(i.selectedResistance) {
                        variantInfo = ` (Res: ${i.selectedResistance})`;
                    }

                    // Formato: "- 2x Nombre del Producto (Color: Rojo)"
                    return `- *${i.qty}x* ${i.name}${variantInfo}`;
                }).join('\n');
                // -------------------------------------------------------------
                
                const textRaw = `🚨 *NUEVO PEDIDO RECIBIDO* 🚨\n\n` +
                             `🆔 *Pedido:* ${oid}\n` + 
                             `👤 *Cliente:* ${order.billing.name}\n` +
                             `📞 *Tel:* ${order.billing.phone}\n` +
                             `💰 *Total:* S/ ${order.total.toFixed(2)}\n` +
                             `💳 *Pago:* ${order.payment.method}\n` +
                             `🔢 *N° Operación:* ${order.payment.securityCode}\n\n` + 
                             `📦 *Productos:*\n${itemsList}`;

                const encodedText = encodeURIComponent(textRaw);
                // Asegúrate de que las variables token y chatId sean accesibles aquí
                // Usamos window.checkoutManager para asegurar el acceso a las propiedades
                const url = `https://api.telegram.org/bot${window.checkoutManager.telegramToken}/sendMessage?chat_id=${window.checkoutManager.telegramChatId}&text=${encodedText}&parse_mode=Markdown&disable_notification=false`;

                try { await fetch(url); } catch (e) { console.error("Error Telegram", e); }
            },


            currentOrderId: null,
            lastOrderData: null,

open: () => {
                const modal = document.getElementById('checkout-modal');
                const panel = document.getElementById('checkout-panel');
                
                // Bloqueamos el scroll del fondo
                document.body.classList.add('overflow-hidden');

                document.getElementById('billing-form').classList.remove('hidden');
                document.getElementById('payment-section').classList.add('hidden');
                document.getElementById('success-section').classList.add('hidden');
                
                // Solo rellenar con el nombre del usuario si el campo está vacío
                const nameField = document.getElementById('bill-name');
                if(state.user && state.user.displayName && !nameField.value) {
                    nameField.value = state.user.displayName;
                }
                
                document.getElementById('payment-code').value = '';
                
                const walletSection = document.getElementById('wallet-discount-section');
                if(walletSection) walletSection.remove();

                if(state.wallet > 0) {
                    const form = document.getElementById('billing-form');
                    const div = document.createElement('div');
                    div.id = 'wallet-discount-section';
                    div.className = "bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between mb-4";
                    div.innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="bg-green-500 text-white rounded-full p-1"><i class="ph-bold ph-wallet text-xl"></i></div>
                            <div>
                                <div class="text-sm font-bold text-green-800">Usar Saldo Monedero</div>
                                <div class="text-xs text-green-600">Disponible: S/ ${state.wallet.toFixed(2)}</div>
                            </div>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="use-wallet-check" class="w-5 h-5 accent-green-600 rounded">
                            <span class="text-sm font-bold text-slate-700">Aplicar</span>
                        </label>
                    `;
                    const btn = form.querySelector('button[type="button"]'); 
                    form.insertBefore(div, btn);
                }

                modal.classList.remove('hidden');
                setTimeout(() => panel.classList.remove('translate-x-full'), 10);
            },


close: () => {
                const modal = document.getElementById('checkout-modal');
                const panel = document.getElementById('checkout-panel');
                
                // Reactivamos el scroll del fondo
                document.body.classList.remove('overflow-hidden');

                panel.classList.add('translate-x-full');
                setTimeout(() => modal.classList.add('hidden'), 300);
            },
            goToPayment: () => {
                const req = ['bill-name', 'bill-dni', 'bill-phone', 'bill-dept', 'bill-prov', 'bill-dist'];
                for(let id of req) {
                    if(!document.getElementById(id).value.trim()) return Swal.fire('Faltan datos', 'Por favor completa todos los campos obligatorios (*)', 'warning');
                }
                if(!document.getElementById('terms-check').checked) return Swal.fire('Términos', 'Debes aceptar los términos y condiciones.', 'warning');

                const originalTotal = state.cart.reduce((a,b)=>a+(b.price*b.qty),0);
                let finalTotal = originalTotal;
                let walletDiscount = 0;
                const useWallet = document.getElementById('use-wallet-check')?.checked;

                if (useWallet && state.wallet > 0) {
                    if (state.wallet >= finalTotal) {
                        walletDiscount = finalTotal;
                        finalTotal = 0;
                    } else {
                        walletDiscount = state.wallet;
                        finalTotal = finalTotal - walletDiscount;
                    }
                }

                const displayEl = document.getElementById('payment-total-display');
                if (walletDiscount > 0) {
                    displayEl.innerHTML = `<div class="flex flex-col items-center leading-tight"><span class="text-sm text-slate-400 line-through font-medium">Subtotal: S/ ${originalTotal.toFixed(2)}</span><span class="text-xs text-green-600 font-bold mb-1">(- S/ ${walletDiscount.toFixed(2)} Monedero)</span><span>S/ ${finalTotal.toFixed(2)}</span></div>`;
                } else {
                    displayEl.innerHTML = `S/ ${finalTotal.toFixed(2)}`;
                }

                document.getElementById('billing-form').classList.add('hidden');
                document.getElementById('payment-section').classList.remove('hidden');
            },

            backToBilling: () => {
                document.getElementById('payment-section').classList.add('hidden');
                document.getElementById('billing-form').classList.remove('hidden');
            },

confirmOrder: async () => {
                // 1. Detectar billetera y código
                const walletType = document.querySelector('input[name="wallet_type"]:checked').value;
                const code = document.getElementById('payment-code').value.trim();

                // 2. Validaciones Dinámicas
                if(walletType === 'Yape' && code.length !== 3) {
                    return Swal.fire('Código inválido', 'El código de Yape debe tener 3 dígitos exactos.', 'warning');
                }
                if(walletType === 'Plin' && code.length < 6) {
                    return Swal.fire('Código inválido', 'El N° de Operación de Plin suele tener 6 o más dígitos.', 'warning');
                }

                Swal.showLoading();
                
                const expireTime = Date.now() + (10 * 60 * 1000);
                const useWallet = document.getElementById('use-wallet-check')?.checked;
                let walletUsed = 0;
                let finalTotal = state.cart.reduce((a,b)=>a+(b.price*b.qty),0);
                const originalTotal = finalTotal;

                if (useWallet && state.wallet > 0) {
                    if (state.wallet >= finalTotal) {
                        walletUsed = finalTotal;
                        finalTotal = 0;
                    } else {
                        walletUsed = state.wallet;
                        finalTotal = finalTotal - walletUsed;
                    }
                }

                const orderData = {
                    userId: state.user.uid,
                    customerName: document.getElementById('bill-name').value,
                    billing: {
                        name: document.getElementById('bill-name').value,
                        dni: document.getElementById('bill-dni').value,
                        phone: document.getElementById('bill-phone').value,
                        ruc: document.getElementById('bill-ruc').value || '---',
                        address: `${document.getElementById('bill-dept').value}, ${document.getElementById('bill-prov').value}, ${document.getElementById('bill-dist').value}`
                    },
                    payment: { method: `QR/${walletType}`, securityCode: code },
                    items: [...state.cart],
                    total: finalTotal,
                    originalTotal: originalTotal,
                    walletUsed: walletUsed,
                    date: new Date().toISOString(),
                    status: 'Pendiente de Validación',
                    expireAt: expireTime
                };

                try {
                    const newOrderRef = push(ref(db, `users/${state.user.uid}/orders`));
                    const orderId = newOrderRef.key;
                    const updates = {};
                    
                    // Guardar pedido
                    updates[`users/${state.user.uid}/orders/${orderId}`] = orderData;
                    updates[`all_orders/${orderId}`] = { ...orderData, id: orderId };

// --- LÓGICA DE STOCK MAESTRA ---
                    state.cart.forEach(item => {
                        const originalProd = PRODUCTS.find(p => p.id === item.id);
                        if(originalProd) {
                            // 1. Restar del Stock General
                            const newStock = (originalProd.stock || 0) - item.qty;
                            updates[`products/${item.id}/stock`] = newStock >= 0 ? newStock : 0;

                            // 2. Restar del Stock de Color
                            if (item.selectedColor && originalProd.colors) {
                                const cIndex = originalProd.colors.findIndex(c => c.name === item.selectedColor);
                                if (cIndex !== -1) {
                                    const cQty = parseInt(originalProd.colors[cIndex].qty) || 0;
                                    const newCQty = cQty - item.qty;
                                    updates[`products/${item.id}/colors/${cIndex}/qty`] = newCQty >= 0 ? newCQty : 0;
                                }
                            }

                            // 3. Restar del Stock de Resistencia
                            if (item.selectedResistance && originalProd.resistances) {
                                const rIndex = originalProd.resistances.findIndex(r => r.value === item.selectedResistance);
                                if (rIndex !== -1) {
                                    const rQty = parseInt(originalProd.resistances[rIndex].qty) || 0;
                                    const newRQty = rQty - item.qty;
                                    updates[`products/${item.id}/resistances/${rIndex}/qty`] = newRQty >= 0 ? newRQty : 0;
                                }
                            }
                        }
                    });
                    // ---------------------------------------------

                    if (walletUsed > 0) updates[`users/${state.user.uid}/wallet`] = (state.wallet - walletUsed);

                    await update(ref(db), updates);
                    checkoutManager.currentOrderId = orderId;
                    checkoutManager.lastOrderData = orderData;

                    checkoutManager.sendTelegramAlert({ ...orderData, id: orderId });

                    state.cart = [];
                    cartManager.save();

                    document.getElementById('payment-section').classList.add('hidden');
                    document.getElementById('success-section').classList.remove('hidden');
                    
                    const msg = `Hola, acabo de realizar el pedido ${orderId.slice(-6)} pagando con ${walletType}. Adjunto mi constancia.`;
                    document.getElementById('whatsapp-link').href = `https://wa.me/51960436357?text=${encodeURIComponent(msg)}`;
                    Swal.close();
                } catch (err) {
                    console.error(err);
                    Swal.fire('Error', 'No se pudo registrar el pedido: ' + err.message, 'error');
                }
            },

            confirmWhatsAppOrder: async () => {
                Swal.showLoading();
                const expireTime = Date.now() + (10 * 60 * 1000);
                const useWallet = document.getElementById('use-wallet-check')?.checked;
                let walletUsed = 0;
                let finalTotal = state.cart.reduce((a,b)=>a+(b.price*b.qty),0);
                const originalTotal = finalTotal;

                if (useWallet && state.wallet > 0) {
                    if (state.wallet >= finalTotal) {
                        walletUsed = finalTotal;
                        finalTotal = 0;
                    } else {
                        walletUsed = state.wallet;
                        finalTotal = finalTotal - walletUsed;
                    }
                }

                const orderData = {
                    userId: state.user.uid,
                    customerName: document.getElementById('bill-name').value,
                    billing: {
                        name: document.getElementById('bill-name').value,
                        dni: document.getElementById('bill-dni').value,
                        phone: document.getElementById('bill-phone').value,
                        ruc: document.getElementById('bill-ruc').value || '---',
                        address: `${document.getElementById('bill-dept').value}, ${document.getElementById('bill-prov').value}, ${document.getElementById('bill-dist').value}`
                    },
                    payment: { method: 'WhatsApp/Otro', securityCode: 'N/A' },
                    items: [...state.cart],
                    total: finalTotal,
                    originalTotal: originalTotal,
                    walletUsed: walletUsed,
                    date: new Date().toISOString(),
                    status: 'Pendiente de Validación',
                    expireAt: expireTime
                };

                try {
                    const newOrderRef = push(ref(db, `users/${state.user.uid}/orders`));
                    const orderId = newOrderRef.key;
                    const updates = {};
                    updates[`users/${state.user.uid}/orders/${orderId}`] = orderData;
                    updates[`all_orders/${orderId}`] = { ...orderData, id: orderId };

                    state.cart.forEach(item => {
                        const originalProd = PRODUCTS.find(p => p.id === item.id);
                        if(originalProd) {
                            const newStock = (originalProd.stock || 0) - item.qty;
                            updates[`products/${item.id}/stock`] = newStock >= 0 ? newStock : 0;
                        }
                    });

                    if (walletUsed > 0) updates[`users/${state.user.uid}/wallet`] = (state.wallet - walletUsed);

                    await update(ref(db), updates);
                    checkoutManager.currentOrderId = orderId;
                    checkoutManager.lastOrderData = orderData;

                    checkoutManager.sendTelegramAlert({ ...orderData, id: orderId });

                    state.cart = [];
                    cartManager.save();

                    document.getElementById('payment-section').classList.add('hidden');
                    document.getElementById('success-section').classList.remove('hidden');
                    
                    const msg = `Hola TechPerú, he realizado el pedido #${orderId.slice(-6)} por la web. Quiero coordinar el pago por otro medio (Transferencia/Plin/Efectivo).`;
                    const waLink = `https://wa.me/51960436357?text=${encodeURIComponent(msg)}`;
                    
                    document.getElementById('whatsapp-link').href = waLink;
                    window.open(waLink, '_blank');

                    Swal.close();
                } catch (err) {
                    console.error(err);
                    Swal.fire('Error', 'No se pudo registrar el pedido.', 'error');
                }
            },



downloadPDF: (customOrder = null) => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                const data = customOrder || checkoutManager.lastOrderData;
                
                let oid = '---';
                if(customOrder && customOrder.id) oid = customOrder.id.slice(-6);
                else if(checkoutManager.currentOrderId) oid = checkoutManager.currentOrderId.slice(-6);

                if(!data) return Swal.fire('Error', 'No hay datos para generar el PDF', 'error');
                const logoUrl = "https://qeoojbsrqlroajvdgrju.supabase.co/storage/v1/object/public/productos/2MTECHPERU%20Logo%20ticket.png";
                
                const ancho = 25;  // Ancho del logo en el PDF
                const alto = 17;   // Alto del logo (Si se ve aplastado, sube este número)

                // 3. Dibujamos el logo
                doc.addImage(logoUrl, 'PNG', 14, 10, ancho, alto);

                // 4. Escribimos el título debajo
                doc.setFontSize(24); 
                doc.setFont("helvetica", "bold"); 
                // El 8 es el espacio entre logo y texto
                doc.text("2MTechPerú", 14, 10 + alto + 8); 

                // --- FIN OPCIÓN MANUAL ---
                doc.setFontSize(10); doc.setFont("helvetica", "normal");
                doc.text("Voucher de Compra", 195, 18, { align: 'right' });
                doc.text(`Pedido: #${oid}`, 195, 23, { align: 'right' });
                
                if(data.payment.method === 'WhatsApp/Otro' || data.payment.securityCode === 'N/A') {
                    doc.text(`Método: Coordinar WhatsApp`, 195, 28, { align: 'right' });
                } else {
                    // Detectamos si es Yape o Plin para la etiqueta
                    const isYape = data.payment.method.includes('Yape');
                    const label = isYape ? 'Cód. Aprobación:' : 'N° Operación:';
                    doc.text(`${label} ${data.payment.securityCode}`, 195, 28, { align: 'right' });
                }
                
                // Usamos la fecha del pedido guardado, no la actual, para que sea fiel al historial
                const dateStr = data.date ? new Date(data.date).toLocaleDateString() + ' ' + new Date(data.date).toLocaleTimeString() : new Date().toLocaleDateString();
                doc.text(`Fecha: ${dateStr}`, 195, 33, { align: 'right' });
                
                doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("Datos del Cliente:", 14, 45);
                doc.setFontSize(10); doc.setFont("helvetica", "normal");
                const startInfoY = 52;
                doc.text(`Nombre:`, 14, startInfoY); doc.text(data.billing.name, 45, startInfoY);
                doc.text(`Documento:`, 14, startInfoY+5); doc.text(data.billing.dni, 45, startInfoY+5);
                doc.text(`Teléfono:`, 14, startInfoY+10); doc.text(data.billing.phone, 45, startInfoY+10);
                doc.text(`Dirección:`, 14, startInfoY+15); doc.text(data.billing.address, 45, startInfoY+15);


// MODIFICACIÓN PARA PDF: Agregamos Color o Resistencia al nombre
                const tableBody = data.items.map(item => {
                    let description = item.name;
                    
                    // 1. Si tiene Color, lo agregamos
                    if (item.selectedColor) {
                        description += ` (${item.selectedColor})`;
                    }
                    
                    // 2. Si tiene Resistencia, la agregamos
                    if (item.selectedResistance) {
                        description += ` (Res: ${item.selectedResistance})`;
                    }
                        
                    return [item.qty, description, `S/ ${item.price.toFixed(2)}`, `S/ ${(item.qty * item.price).toFixed(2)}`];
                });


                doc.autoTable({ startY: 80, head: [['Cant.', 'Descripción', 'P. Unit', 'Subtotal']], body: tableBody, theme: 'plain', styles: { fontSize: 10, cellPadding: 3 }, headStyles: { fillColor: false, textColor: [0,0,0], fontStyle: 'bold', lineWidth: {bottom: 0.5}, lineColor: [200,200,200] }, bodyStyles: { lineWidth: {bottom: 0.1}, lineColor: [230,230,230] }, columnStyles: { 0: { cellWidth: 20 }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } } });

                let finalY = doc.lastAutoTable.finalY + 10;
                doc.text(`Subtotal:`, 150, finalY, { align: 'right' }); doc.text(`S/ ${data.originalTotal.toFixed(2)}`, 195, finalY, { align: 'right' });
                if (data.walletUsed > 0) { finalY += 6; doc.text(`Desc. Monedero:`, 150, finalY, { align: 'right' }); doc.text(`- S/ ${data.walletUsed.toFixed(2)}`, 195, finalY, { align: 'right' }); }
                doc.text(`Envío:`, 150, finalY+6, { align: 'right' }); doc.text(`Contraentrega`, 195, finalY+6, { align: 'right' });
               
                doc.setDrawColor(0); doc.setLineWidth(0.5); doc.line(130, finalY+10, 195, finalY+10);
                doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(`TOTAL PAGADO:`, 150, finalY+18, { align: 'right' }); doc.text(`S/ ${data.total.toFixed(2)}`, 195, finalY+18, { align: 'right' });
                doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(100); doc.text("¡Gracias por comprar en 2MTechPerú!", 105, finalY+35, { align: 'center' }); doc.text("Este es un voucher de compra. Envíe su constancia de pago por WhatsApp.", 105, finalY+40, { align: 'center' });
                
                // Nombre del archivo con el ID
                doc.save(`Voucher_TechPerú_${oid}.pdf`);
            }


        };

window.authManager = {
            isRegistering: false,
            handleForm: async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email').value;
                const pass = document.getElementById('auth-pass').value;
                const nameInput = document.getElementById('reg-name');

                try {
                    Swal.showLoading();

                    if (authManager.isRegistering) {
                        // --- NUEVO: VALIDACIÓN DE REPETIR CONTRASEÑA ---
                        const passConfirm = document.getElementById('auth-pass-confirm').value;
                        
                        if (pass !== passConfirm) {
                            throw new Error("Las contraseñas no coinciden. Por favor verifícalas.");
                        }

                        // Lógica de Registro (Igual que antes)
                        const ipResponse = await fetch('https://api.ipify.org?format=json');
                        const ipData = await ipResponse.json();
                        const userIP = ipData.ip.replace(/\./g, '-'); 
                        const today = new Date().toLocaleDateString();

                        const ipLogRef = ref(db, `security_logs/${userIP}`);
                        const ipSnapshot = await get(ipLogRef);

                        if (ipSnapshot.exists()) {
                            const lastDate = ipSnapshot.val().date;
                            if (lastDate === today) throw new Error("Bloqueo de Seguridad: Para crear una nueva cuenta intenta mañana.");
                        }
                        if(!nameInput.value) throw new Error("El nombre es obligatorio");

                        const cred = await createUserWithEmailAndPassword(auth, email, pass);
                        await set(ipLogRef, { date: today });
                        await updateProfile(cred.user, { displayName: nameInput.value });
                        await set(ref(db, 'users/' + cred.user.uid), { 
                            username: nameInput.value, email: email, createdAt: new Date().toISOString(),
                            registeredIP: ipData.ip, points: 0, wallet: 0, isBlocked: false
                        });
                    } else {
                        // LOGIN NORMAL
                        const cred = await signInWithEmailAndPassword(auth, email, pass);
                        
                        const userRef = ref(db, `users/${cred.user.uid}`);
                        const snapshot = await get(userRef);
                        const userData = snapshot.val();

                        if (userData && userData.isBlocked === true) {
                            await signOut(auth); 
                            throw new Error("⛔ TU CUENTA ESTÁ BLOQUEADA POR SEGURIDAD. Contacta a soporte.");
                        }
                    }
                    Swal.close();
                    router.navigate('/'); 
                } catch (err) {
                    console.error(err);
                    let msg = err.message.replace("Firebase: ", "").replace("Error ", "");
                    if(err.code === 'auth/invalid-credential') msg = "Correo o contraseña incorrectos.";
                    if(err.code === 'auth/weak-password') msg = "La contraseña debe tener al menos 6 caracteres.";
                    if(err.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado.";
                    Swal.fire('Atención', msg, 'error');
                }
            },
            logout: async () => { 
                try {
                    await signOut(auth); 
                    state.user = null;
                    state.cart = [];
                    state.orders = [];
                    state.favorites.clear();
                    localStorage.removeItem('techPerú_cart');
                    Swal.fire({icon: 'success', title: 'Sesión Cerrada', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false});
                    router.navigate('/');
                    window.location.reload(); 
                } catch(e) { console.error(e); }
            }
        };



onAuthStateChanged(auth, (user) => {
    state.user = user;
    const label = document.getElementById('auth-label');
    const arrow = document.getElementById('auth-arrow'); // La flechita
    const menuContent = document.getElementById('auth-menu-content'); // El interior del menú
    const menuDropdown = document.getElementById('auth-menu-dropdown'); // <--- NUEVA REFERENCIA IMPORTANTE

    if (user) {


// --- PEGAR ESTO AQUÍ (INICIO) ---
        // Esto guarda la fecha y hora exacta en la base de datos
        update(ref(db, `users/${user.uid}`), {
            lastLogin: new Date().toISOString()
        });
        // --- PEGAR ESTO AQUÍ (FIN) ---


        if (menuDropdown) menuDropdown.classList.remove('hidden');
        // --- USUARIO LOGUEADO ---
        
        // 1. UI: Mostrar Nombre y Flecha
        const name = user.displayName ? user.displayName.split(' ')[0] : 'Usuario';
        
        if (label) label.innerHTML = `Hola, ${name}<br><span class="text-green-400 font-normal">Mi Cuenta</span>`;
        if (arrow) arrow.classList.remove('hidden'); // Mostramos la flechita

        // 2. GENERAR EL MENÚ DESPLEGABLE PROFESIONAL
        if (menuContent) {
            menuContent.innerHTML = `
                <div class="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conectado como</p>
                    <p class="text-sm font-bold text-slate-900 truncate">${user.email}</p>
                </div>
                
                <div class="p-2">
                    <button onclick="router.navigate('/profile', {tab: 'summary'})" class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-cyan-50 hover:text-cyan-800 transition group">
                        <i class="ph-bold ph-user-circle text-lg group-hover:text-[#26E4ED]"></i> Resumen
                    </button>
                    
                    <button onclick="router.navigate('/profile', {tab: 'orders'})" class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition group">
                        <i class="ph-bold ph-package text-lg group-hover:text-blue-500"></i> Mis Pedidos
                    </button>
                    
                    <button onclick="router.navigate('/profile', {tab: 'favorites'})" class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition group">
                        <i class="ph-bold ph-heart text-lg group-hover:text-red-500"></i> Favoritos
                    </button>
                </div>

                <div class="border-t border-slate-100 p-2">
                    <button onclick="authManager.logout()" class="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition">
                        <i class="ph-bold ph-sign-out text-lg"></i> Cerrar Sesión
                    </button>
                </div>
            `;
        }


// --- NUEVO: MONITOR DE BLOQUEO EN TIEMPO REAL ---
// --- MONITOR DE BLOQUEO EN TIEMPO REAL MEJORADO ---
                onValue(ref(db, `users/${user.uid}/isBlocked`), async (snapshot) => {
                    const isBlocked = snapshot.val();
                    if (isBlocked === true) {
                        // Si se detecta bloqueo, cerramos sesión y mandamos al home
                        await signOut(auth);
                        state.user = null; // Limpiar estado local
                        router.navigate('/'); // Navegar visualmente al home
                        
                        Swal.fire({
                            title: 'Acceso Restringido',
                            html: '<p>Tu cuenta ha sido bloqueada temporalmente.</p>',
                            icon: 'error',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#0f172a',
                            allowOutsideClick: false,
                            allowEscapeKey: false
                        }).then(() => {
                            window.location.reload(); // Recarga final para limpiar todo rastro
                        });
                    }
                });
                // ------------------------------------------------
                // ------------------------------------------------


                if (label) label.innerHTML = `Hola, ${name}<br><span class="text-[#00979d] font-normal">Mi Perfil</span>`;
                
                const cartRef = ref(db, `users/${user.uid}/cart`);

                // 2. FUSIÓN INICIAL (Solo se ejecuta una vez al conectar)
                // Sirve para no perder lo que agregaste antes de loguearte
                get(cartRef).then((snapshot) => {
                    const cloudCart = snapshot.val() || [];
                    const localCart = state.cart; 

                    if (localCart.length > 0) {
                        // Si tengo productos locales, los mezclo con la nube
                        const finalMap = new Map();
                        cloudCart.forEach(item => finalMap.set(item.id, item));

// --- INICIO DE CORRECCIÓN ---
                localCart.forEach(item => {
                    if (finalMap.has(item.id)) {
                        const existing = finalMap.get(item.id);
                        
                        // CORRECCIÓN: En vez de sumar (+=), usamos el número mayor.
                        // Si Nube tiene 5 y Local tiene 5 -> Se queda en 5 (No duplica).
                        // Si Nube tiene 5 y Local tiene 6 (agregaste uno offline) -> Se actualiza a 6.
                        existing.qty = Math.max(existing.qty, item.qty);
                        
                        finalMap.set(item.id, existing);
                    } else {
                        finalMap.set(item.id, item);
                    }
                });
                // --- FIN DE CORRECCIÓN ---
                        
                        // Subimos la mezcla perfecta a la nube
                        set(cartRef, Array.from(finalMap.values()));
                    }
                });

                // 3. ¡AQUÍ ESTÁ LA MAGIA! -> ESCUCHA EN TIEMPO REAL (onValue)
                // Esto reemplaza al 'get' simple. Se queda escuchando cambios para siempre.
                onValue(cartRef, (snapshot) => {
                    const data = snapshot.val();
                    
                    // Actualizamos la variable local con lo que diga la nube
                    state.cart = data || []; 
                    
                    // Guardamos en LocalStorage para que no parpadee al recargar
                    localStorage.setItem('techPerú_cart', JSON.stringify(state.cart));
                    
                    // Actualizamos el ícono del carrito (burbuja roja)
                    const c = state.cart.reduce((a,b)=>a+b.qty,0);
                    const badge = document.getElementById('cart-count');
                    if(badge) {
                        badge.innerText = c; 
                        badge.classList.toggle('opacity-0', c === 0);
                    }
                    
                    // Si el carrito está abierto, redibujamos los productos
                    cartManager.render(); 
                });

                // 4. Cargar Favoritos (También en tiempo real)
                onValue(ref(db, `users/${user.uid}/favorites`), (snapshot) => {
                    state.favorites.clear();
                    const data = snapshot.val();
                    if (data) Object.keys(data).forEach(key => state.favorites.add(key));
                    
                    // Si estamos en la página de perfil, refrescar
                    if(window.location.search.includes('profile')) router.handle(false);
                    // O refrescar las tarjetas de productos (corazones)
                    const app = document.getElementById('app');
                    if (app && !window.location.search.includes('profile')) router.handle(false);
                });

                // 5. Cargar Pedidos y Notificaciones
                onValue(ref(db, `users/${user.uid}/orders`), (snapshot) => {
                    const data = snapshot.val();
                    const newOrders = data ? Object.entries(data).map(([key, value]) => ({ ...value, id: key })).reverse() : [];

                    // Detector de "Pedido Aprobado" para notificar
                    if (state.orders.length > 0) { 
                        newOrders.forEach(newOrder => {
                            const oldOrder = state.orders.find(o => o.id === newOrder.id);

// --- CÓDIGO NUEVO PARA LA NOTIFICACIÓN ---
                    if (oldOrder && oldOrder.status !== 'Aprobado' && newOrder.status === 'Aprobado') {
                        Swal.fire({
                            title: '¡Pago Validado! 🎉',
                            html: `<div class="text-left">
                                     <p class="text-sm text-slate-600 mb-1">Tu pedido <b>#${newOrder.id.slice(-6)}</b> ha sido aprobado.</p>
                                     <p class="text-xs text-slate-400">Ya estamos preparando tu envío.</p>
                                   </div>`,
                            icon: 'success',
                            toast: true,
                            position: 'top-end',
                            
                            // 1. AGREGAMOS EL BOTÓN DE CIERRE
                            showCloseButton: true, 
                            
                            // 2. AGREGAMOS LA BARRA DE TIEMPO (Estilo "Tiempo en línea")
                            timer: 10000, // 10 segundos
                            timerProgressBar: true, 

                            showConfirmButton: true,
                            confirmButtonText: 'Ver Pedido',
                            confirmButtonColor: '#0f172a', // Color Slate-900 (Tu tema)
                            
                            // Efecto: Si pasas el mouse, el tiempo se detiene
                            didOpen: (toast) => {
                                toast.onmouseenter = Swal.stopTimer;
                                toast.onmouseleave = Swal.resumeTimer;
                            }
                        }).then((r) => { 
                            if(r.isConfirmed) router.navigate('/profile', { tab: 'orders' }); 
                        });
                    }
                    // -----------------------------------------
                        });
      
                    }

                    
                    state.orders = newOrders;
                    if(window.location.search.includes('profile')) router.handle(false);
                });


// --- 6. AGREGAR ESTO: Cargar Puntos y Monedero en Tiempo Real ---
        onValue(ref(db, `users/${user.uid}`), (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Actualizamos el estado local con lo que hay en la base de datos
                state.points = parseInt(data.points) || 0;
                state.wallet = parseFloat(data.wallet) || 0;

                // Si el usuario está viendo su perfil ahora mismo, refrescamos la pantalla
                if(window.location.search.includes('profile')) {
                    router.handle(false);
                }
            }
        });
        // -------------------------------------------------------------



} else {
        // --- USUARIO NO LOGUEADO ---
        if (menuDropdown) menuDropdown.classList.add('hidden');
        // UI: Texto por defecto
        if (label) label.innerHTML = `Mi Cuenta<br><span class="text-slate-400 font-normal">Entrar / Registro</span>`;
        if (arrow) arrow.classList.add('hidden'); // Ocultamos flecha
        if (menuContent) menuContent.innerHTML = ''; // Limpiamos menú para seguridad

        // Limpieza de estados (igual que tenías antes)
        state.favorites.clear();
        state.orders = [];
        state.cart = [];
        localStorage.removeItem('techPerú_cart');
        cartManager.render();
        const badge = document.getElementById('cart-count');
        if(badge) badge.classList.add('opacity-0');
        
        router.handle();
    }
});

        window.waManager = {
            isOpen: false,
            toggle: () => {
                const box = document.getElementById('wa-chat-window');
                const mainIcon = document.getElementById('wa-icon-main');
                const closeIcon = document.getElementById('wa-icon-close');
                
                waManager.isOpen = !waManager.isOpen;

                if (waManager.isOpen) {
                    box.classList.remove('scale-0', 'opacity-0');
                    mainIcon.classList.add('opacity-0', 'scale-50');
                    closeIcon.classList.remove('opacity-0', 'scale-50');
                    setTimeout(() => document.getElementById('wa-message-input').focus(), 300);
                } else {
                    box.classList.add('scale-0', 'opacity-0');
                    mainIcon.classList.remove('opacity-0', 'scale-50');
                    closeIcon.classList.add('opacity-0', 'scale-50');
                }
            },
            send: () => {
                const input = document.getElementById('wa-message-input');
                const text = input.value.trim();
                if (!text) return;
                const phone = "51960436357";
                const msg = `Hola TechPerú, tengo una consulta: ${text}`;
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                input.value = '';
                waManager.toggle();
            }
        };




// --- NUEVO: CEREBRO DE COLORES ---
// Variable para recordar qué color eligió el cliente
window.selectedColorData = null;



window.selectProductResistance = (index, productID) => {
    // Buscar producto actualizado
    const p = PRODUCTS.find(x => x.id === productID);
    if(!p || !p.resistances) return;

    const res = p.resistances[index];
    
    // Guardar selección
    window.selectedResistanceData = res;
    window.selectedColorData = null; // Limpiar selección de color para no mezclar

    // A. VISUAL: Resetear estilos de todos los botones
    document.querySelectorAll('.res-btn-option').forEach(el => {
        el.classList.remove('bg-slate-900', 'text-white', 'border-slate-900');
        el.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
    });

    // B. VISUAL: Activar el botón seleccionado
    const activeBtn = document.getElementById(`res-btn-${index}`);
    if(activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        activeBtn.classList.add('bg-slate-900', 'text-white', 'border-slate-900');
    }

    // C. Mostrar Stock
    const stockDisplay = document.getElementById('dynamic-stock-label');
    if(stockDisplay) {
        stockDisplay.innerHTML = `<span class="text-slate-900 font-bold">Stock de ${res.value}:</span> ${res.qty} unid.`;
    }

    // D. Resetear cantidad a 1
    const qtyInput = document.getElementById('detail-qty-input');
    if(qtyInput) {
        qtyInput.value = 1;
        window.currentMaxStock = res.qty;
    }

    // Ocultar alertas
    const warning = document.getElementById('variant-warning-msg');
    if(warning) warning.classList.add('hidden');
};



// Función que se activa al dar clic en un círculo de color
window.selectProductColor = (index, productID) => {
    // Buscamos el producto en tu lista
    const p = PRODUCTS.find(x => x.id === productID);
    if(!p || !p.colors) return;

    // Obtenemos el color específico (ej: Rojo)
    const color = p.colors[index];
    
    // Guardamos este color en la "memoria" temporal
    window.selectedColorData = color;

    // A. VISUAL: Quitar borde a todos los círculos
    document.querySelectorAll('.color-circle-option').forEach(el => {
        el.classList.remove('ring-2', 'ring-offset-2', 'ring-slate-900', 'scale-110');
        // Ocultar el check de todos
        const checkIcon = el.querySelector('.check-icon');
        if(checkIcon) checkIcon.classList.add('hidden');
    });
    
    // B. VISUAL: Poner borde al seleccionado
    const activeCircle = document.getElementById(`color-btn-${index}`);
    if(activeCircle) {
        activeCircle.classList.add('ring-2', 'ring-offset-2', 'ring-slate-900', 'scale-110');
        const activeCheck = activeCircle.querySelector('.check-icon');
        if(activeCheck) activeCheck.classList.remove('hidden');
    }

    // C. ACTUALIZAR STOCK EN PANTALLA
    // Cambiamos el texto que dice "Disponible" por el stock de ese color
const stockDisplay = document.getElementById('dynamic-stock-label');
    if(stockDisplay) {
        // AQUI ESTÁ LA CLAVE: color.qty vendrá actualizado de Firebase tras el Paso 1
        stockDisplay.innerHTML = `<span class="text-slate-900 font-bold">Stock en ${color.name}:</span> ${color.qty} unid.`;
    }
    // D. RESETEAR CANTIDAD A 1
    // Para evitar que pidan más de lo que hay en ese color
    const qtyInput = document.getElementById('detail-qty-input');
    if(qtyInput) {
        qtyInput.value = 1;
        // Guardamos el stock máximo de ESTE color para validar después
        window.currentMaxStock = color.qty;
    }
    
    // Ocultar mensaje de error si estaba visible
    const warning = document.getElementById('color-warning-msg');
    if(warning) warning.classList.add('hidden');
};
// ------------------------------------------


// --- LÓGICA SELECT PREMIUM (Actualizada) ---
window.handleResistanceChange = (selectElement, productID) => {
    const index = selectElement.value;
    if (index === "") return;

    const p = PRODUCTS.find(x => x.id === productID);
    if (!p || !p.resistances) return;

    const res = p.resistances[index];

    // 1. Guardar datos
    window.selectedResistanceData = res;
    window.selectedColorData = null;

    // 2. Actualizar Stock con diseño visual (Verde si hay stock)
    const stockDisplay = document.getElementById('dynamic-stock-label');
    if (stockDisplay) {
        if(res.qty > 0) {
            stockDisplay.innerHTML = `<i class="ph-fill ph-check-circle text-green-500"></i> Stock: ${res.qty} unid.`;
            stockDisplay.className = "text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 shadow-sm transition-all duration-300";
        } else {
            stockDisplay.innerHTML = `Agotado`;
            stockDisplay.className = "text-[10px] font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200 shadow-sm";
        }
    }

    // 3. Resetear inputs
    const qtyInput = document.getElementById('detail-qty-input');
    if (qtyInput) {
        qtyInput.value = 1;
        window.currentMaxStock = res.qty;
    }

    // 4. Quitar alertas
    const warning = document.getElementById('variant-warning-msg');
    if (warning) warning.classList.add('hidden');
};



// --- GESTOR DE ZOOM PROFESIONAL (MODAL) ---
window.imageModalManager = {
    panzoomInstance: null,
    currentIndex: 0, // Variable para saber en qué foto estamos

    open: (imgSrc) => {
        const modal = document.getElementById('product-zoom-modal');
        const img = document.getElementById('zoom-modal-img');
        const container = document.getElementById('zoom-pan-container');
        
        if(!modal || !img || !container) return;

        // Sincronizar el índice actual con el de la página de producto
        if (window.currentProdIdx !== undefined) {
            window.imageModalManager.currentIndex = window.currentProdIdx;
        }

        // 1. Mostrar Modal
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
        }, 10);
        
        document.body.classList.add('overflow-hidden'); 

        // 2. Cargar imagen e iniciar Panzoom
        img.onload = () => {
            if (window.imageModalManager.panzoomInstance) {
                window.imageModalManager.panzoomInstance.destroy();
            }

            window.imageModalManager.panzoomInstance = Panzoom(img, {
                maxScale: 4,
                minScale: 0.8,
                startScale: 1,
                cursor: 'move'
            });

            setTimeout(() => window.imageModalManager.panzoomInstance.reset(), 50);
            container.addEventListener('wheel', window.imageModalManager.panzoomInstance.zoomWithWheel);
        };

        img.src = imgSrc;
    },

    close: () => {
        const modal = document.getElementById('product-zoom-modal');
        const container = document.getElementById('zoom-pan-container');
        
        if(!modal) return;

        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        
        document.body.classList.remove('overflow-hidden');

        setTimeout(() => {
            modal.classList.add('hidden');
            document.getElementById('zoom-modal-img').src = '';
        }, 300);

        if (window.imageModalManager.panzoomInstance && container) {
            container.removeEventListener('wheel', window.imageModalManager.panzoomInstance.zoomWithWheel);
        }
    },

    // --- NUEVAS FUNCIONES PARA FLECHAS ---
    changeImage: (step) => {
        // Verificar si hay galería
        if (!window.currentProdImages || window.currentProdImages.length <= 1) return;

        // Calcular nuevo índice (Matemática circular)
        let newIndex = window.imageModalManager.currentIndex + step;
        if (newIndex >= window.currentProdImages.length) newIndex = 0;
        if (newIndex < 0) newIndex = window.currentProdImages.length - 1;

        // Actualizar índice y cambiar imagen
        window.imageModalManager.currentIndex = newIndex;
        const img = document.getElementById('zoom-modal-img');
        
        // Efecto visual de recarga
        img.style.opacity = '0.5';
        setTimeout(() => {
            img.src = window.currentProdImages[newIndex];
            img.onload = () => {
                img.style.opacity = '1';
                // Reiniciar zoom al cambiar foto
                if (window.imageModalManager.panzoomInstance) {
                    window.imageModalManager.panzoomInstance.reset();
                }
            };
        }, 150);
    },

    next: () => window.imageModalManager.changeImage(1),
    prev: () => window.imageModalManager.changeImage(-1),

    zoomIn: () => window.imageModalManager.panzoomInstance && window.imageModalManager.panzoomInstance.zoomIn(),
    zoomOut: () => window.imageModalManager.panzoomInstance && window.imageModalManager.panzoomInstance.zoomOut(),
    reset: () => window.imageModalManager.panzoomInstance && window.imageModalManager.panzoomInstance.reset()
};


window.cartManager = {
            toggleCart: () => {
                const el = document.getElementById('cart-overlay');
                const p = document.getElementById('cart-panel');
                const bg = document.getElementById('cart-backdrop');
                
                if(el.classList.contains('hidden')) { 
                    el.classList.remove('hidden'); 
                    document.body.classList.add('overflow-hidden');
                    setTimeout(() => { 
                        bg.classList.remove('opacity-0'); 
                        p.classList.remove('translate-x-full'); 
                    }, 10); 
                } 
                else { 
                    bg.classList.add('opacity-0'); 
                    p.classList.add('translate-x-full'); 
                    document.body.classList.remove('overflow-hidden');
                    setTimeout(() => el.classList.add('hidden'), 500); 
                }
            },

            add: (id, qtyToAdd = 1) => {
                const p = PRODUCTS.find(x => x.id === id);
                if(!p) return Swal.fire('Error', 'Producto no disponible', 'error');

                let finalId = p.id;
                let selectedRes = null;
                let selectedCol = null;

                // CASO 1: TIENE COLORES
                if (p.hasColors && p.colors && p.colors.length > 0) {
                    if (!window.selectedColorData) {
                        const warning = document.getElementById('variant-warning-msg') || document.getElementById('color-warning-msg');
                        if(warning) warning.classList.remove('hidden');
                        return Swal.fire('Atención', 'Selecciona un color.', 'warning');
                    }
                    selectedCol = window.selectedColorData;
                    finalId = `${p.id}-${selectedCol.name}`;
                    if (qtyToAdd > selectedCol.qty) return Swal.fire('Stock', `Solo quedan ${selectedCol.qty} en ${selectedCol.name}.`, 'warning');
                }
                
                // CASO 2: TIENE RESISTENCIAS
                else if (p.hasResistances && p.resistances && p.resistances.length > 0) {
                    if (!window.selectedResistanceData) {
                        const warning = document.getElementById('variant-warning-msg'); 
                        if(warning) warning.classList.remove('hidden');
                        return Swal.fire('Atención', 'Selecciona un valor de resistencia.', 'warning');
                    }
                    selectedRes = window.selectedResistanceData;
                    finalId = `${p.id}-${selectedRes.value}`; 
                    if (qtyToAdd > selectedRes.qty) return Swal.fire('Stock', `Solo quedan ${selectedRes.qty} de ${selectedRes.value}.`, 'warning');
                }
                
                // CASO 3: NORMAL
                else {
                    const currentStock = parseInt(p.stock || 0);
                    if(qtyToAdd > currentStock) return Swal.fire('Stock', 'No hay suficiente stock.', 'warning');
                }

                // Usamos cartItemId para buscar si ya existe
                const ex = state.cart.find(x => x.cartItemId === finalId);
                if(ex) { 
                    ex.qty += qtyToAdd; 
                } else { 
                    state.cart.push({
                        ...p,
                        cartItemId: finalId, // ESTE ES EL ID ÚNICO DEL ITEM EN EL CARRITO
                        qty: qtyToAdd,
                        selectedColor: selectedCol ? selectedCol.name : null,
                        selectedHex: selectedCol ? selectedCol.hex : null,
                        selectedResistance: selectedRes ? selectedRes.value : null
                    }); 
                }
                
                cartManager.save(); 
                
                const extraInfo = selectedRes ? `(${selectedRes.value})` : (selectedCol ? `(${selectedCol.name})` : '');
                Swal.fire({icon: 'success', title: '¡Añadido!', text: `${qtyToAdd}x ${p.name} ${extraInfo}`, toast: true, position: 'bottom-end', timer: 1500, showConfirmButton: false});
            },

            // USAR cartItemId en lugar de id para evitar conflictos de variantes
            changeQty: (cartItemId, delta) => {
                const item = state.cart.find(x => x.cartItemId === cartItemId);
                if(!item) return;
                
                // Validar stock real (Colores / Resistencias / Normal)
                let maxStock = parseInt(item.stock || 0);
                
                // Si tiene color, buscamos el stock específico
                if(item.selectedColor) {
                    const realProd = PRODUCTS.find(p => p.id === item.id);
                    if(realProd && realProd.colors) {
                        const col = realProd.colors.find(c => c.name === item.selectedColor);
                        if(col) maxStock = col.qty;
                    }
                } 
                // Si tiene resistencia, buscamos el stock específico
                else if(item.selectedResistance) {
                    const realProd = PRODUCTS.find(p => p.id === item.id);
                    if(realProd && realProd.resistances) {
                        const res = realProd.resistances.find(r => r.value === item.selectedResistance);
                        if(res) maxStock = res.qty;
                    }
                }

                let newQty = parseInt(item.qty) + delta;
                if(newQty < 1) newQty = 1; 
                if(newQty > maxStock) return Swal.fire('Tope alcanzado', `Solo hay ${maxStock} unidades disponibles.`, 'warning');

                item.qty = newQty;
                cartManager.save();
            },

            remove: (cartItemId) => { 
                // Borrar por ID único de variante, no por ID de producto
                state.cart = state.cart.filter(x => x.cartItemId !== cartItemId); 
                cartManager.save(); 
            },
            
            save: () => {
                localStorage.setItem('techPerú_cart', JSON.stringify(state.cart));
                const c = state.cart.reduce((a,b)=>a+parseInt(b.qty),0);
                const badge = document.getElementById('cart-count');
                if(badge) { badge.innerText = c; badge.classList.toggle('opacity-0', c === 0); }
                cartManager.render();

                if (state.user) {
                    const cartRef = ref(db, `users/${state.user.uid}/cart`);
                    set(cartRef, state.cart).catch(err => console.error(err));
                }
            },

            render: () => {
                const div = document.getElementById('cart-items-container');
                const subtotalEl = document.getElementById('cart-subtotal');
                let t = 0;

                if (state.cart.length === 0) {
                    div.className = "h-full flex flex-col items-center justify-center p-6"; 
                    div.innerHTML = `
                        <div class="text-center fade-in">
                            <div class="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <i class="ph-fill ph-shopping-bag text-4xl text-slate-300"></i>
                            </div>
                            <h3 class="text-lg font-extrabold text-slate-900 mb-2">Tu carrito está vacío</h3>
                            <p class="text-sm text-slate-400 mb-6 max-w-[200px] mx-auto leading-relaxed">
                                Parece que aún no has agregado nada.
                            </p>
                            <button onclick="cartManager.toggleCart()" class="text-sm font-bold text-[#26E4ED] hover:text-yellow-600 underline transition">
                                Seguir comprando
                            </button>
                        </div>`;
                    document.getElementById('cart-total').innerText = `S/ 0.00`;
                    if(subtotalEl) subtotalEl.innerText = `S/ 0.00`;
                    return;
                }

                div.className = "space-y-4";

                div.innerHTML = state.cart.map(i => {
                    const itemTotal = i.price * i.qty;
                    t += itemTotal;
                    
                    // CORRECCIÓN AQUÍ: Definimos variantBadge correctamente
                    const variantBadge = i.selectedResistance ? `
                        <div class="mt-1 bg-orange-50 text-orange-700 w-fit px-2 py-0.5 rounded border border-orange-100 text-[10px] font-bold">
                            Resistencia: ${i.selectedResistance}
                        </div>
                    ` : (i.selectedColor ? `
                        <div class="flex items-center gap-1 mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded border border-slate-200">
                            <div class="w-2.5 h-2.5 rounded-full border border-slate-300" style="background-color: ${i.selectedHex}"></div>
                            <span class="text-[10px] font-bold text-slate-600">${i.selectedColor}</span>
                        </div>
                    ` : '');
                    
                    // CORRECCIÓN AQUÍ: Usamos i.cartItemId para los botones y variantBadge para el HTML
                    return `
                    <div class="group relative flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up">
                        <div class="w-20 h-20 flex-shrink-0 bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                            <img src="${i.image}" class="w-full h-full object-contain mix-blend-multiply">
                        </div>

                        <div class="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                                <div class="flex justify-between items-start gap-2">
                                    <h4 class="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">${i.name}</h4>
                                    <button onclick="cartManager.remove('${i.cartItemId}')" class="text-slate-300 hover:text-red-500 transition p-1 -mr-2 -mt-2">
                                        <i class="ph-bold ph-trash text-lg"></i>
                                    </button>
                                </div>
                                ${variantBadge} </div>

                            <div class="flex items-end justify-between mt-2">
                                <div class="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-7">
                                    <button onclick="cartManager.changeQty('${i.cartItemId}', -1)" class="w-7 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-l-lg transition"><i class="ph-bold ph-minus text-xs"></i></button>
                                    <input type="number" value="${i.qty}" readonly class="w-8 text-center bg-transparent text-xs font-bold text-slate-900 outline-none m-0 p-0 h-full border-x border-slate-100" />
                                    <button onclick="cartManager.changeQty('${i.cartItemId}', 1)" class="w-7 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-r-lg transition"><i class="ph-bold ph-plus text-xs"></i></button>
                                </div>

                                <div class="text-right">
                                    <div class="font-extrabold text-slate-900 text-sm">S/ ${itemTotal.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('');

                document.getElementById('cart-total').innerText = `S/ ${t.toFixed(2)}`;
                if(subtotalEl) subtotalEl.innerText = `S/ ${t.toFixed(2)}`;
            }
        };

        cartManager.save();


// --- 1. REEMPLAZAR ESTO: Lógica mejorada para escribir cantidades ---
        window.detailQtyManager = {
            update: (delta, maxStock) => {
                const input = document.getElementById('detail-qty-input');
                let current = parseInt(input.value) || 1;
                let next = current + delta;
                if(next < 1) next = 1;
                if(next > maxStock) {
                    next = maxStock;
                    Swal.fire('Stock Máximo', `Solo hay ${maxStock} unidades disponibles.`, 'info');
                }
                input.value = next;
            },
            handleInput: (el, maxStock) => {
                let val = parseInt(el.value);
                if(isNaN(val) || val < 1) val = 1;
                if(val > maxStock) {
                    val = maxStock;
                    Swal.fire('Stock Máximo', `Solo hay ${maxStock} unidades disponibles.`, 'info');
                }
                el.value = val;
            }
        };

// --- FUNCIONES VIDEO YOUTUBE ---
window.getYoutubeId = (url) => {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

window.openVideoModal = (url) => {
    const videoId = getYoutubeId(url);
    if (!videoId) return Swal.fire('Error', 'Link no válido', 'error');
    const modal = document.getElementById('video-modal');
    document.getElementById('video-iframe').src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.closeVideoModal = () => {
    const modal = document.getElementById('video-modal');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('video-iframe').src = "";
    }, 300);
};

        window.reviewManager = {
            currentRating: 0,
            setRating: (stars) => {
                reviewManager.currentRating = stars;
                for(let i=1; i<=5; i++) {
                    const el = document.getElementById(`star-form-${i}`);
                    if(el) {
                        el.classList.remove('ph-bold', 'ph-fill', 'text-[#00979D]', 'text-slate-300');
                        if(i <= stars) el.classList.add('ph-fill', 'text-[#00979D]');
                        else el.classList.add('ph-bold', 'text-slate-300');
                    }
                }
            },
submitReview: async (productId) => {
                if (!state.user) return Swal.fire('Inicia Sesión', 'Debes estar registrado para comentar.', 'warning');
                
                // --- VALIDACIÓN DE SEGURIDAD ---
                const hasPurchased = state.orders.some(order => 
                    order.status === 'Aprobado' && 
                    order.items && 
                    order.items.some(item => item.id === productId)
                );
                
                if (!hasPurchased) {
                    return Swal.fire('Acceso denegado', 'Debes comprar y validar este producto para opinar.', 'error');
                }
                // -------------------------------

                if (reviewManager.currentRating === 0) return Swal.fire('Faltan estrellas', 'Por favor califica con estrellas.', 'warning');
                
                const comment = document.getElementById('review-comment').value;
                if (!comment.trim()) return Swal.fire('Falta comentario', 'Escribe tu opinión.', 'warning');

                const reviewData = {
                    userId: state.user.uid,
                    userName: state.user.displayName || 'Usuario',
                    rating: reviewManager.currentRating,
                    comment: comment,
                    date: new Date().toISOString()
                };
                try {
                    Swal.showLoading();
                    await push(ref(db, `reviews/${productId}`), reviewData);
                    const snapshot = await get(ref(db, `reviews/${productId}`));
                    let totalStars = 0, totalReviews = 0;
                    if (snapshot.exists()) {
                        const reviews = Object.values(snapshot.val());
                        totalReviews = reviews.length;
                        totalStars = reviews.reduce((acc, curr) => acc + curr.rating, 0);
                    }
                    const newAverage = totalReviews > 0 ? (totalStars / totalReviews) : 0;
                    await set(ref(db, `products/${productId}/rating`), newAverage);
                    await set(ref(db, `products/${productId}/reviewCount`), totalReviews);
                    Swal.fire('¡Gracias!', 'Tu opinión ha sido publicada.', 'success');
                    router.navigate('product', {product: PRODUCTS.find(p=>p.id === productId).slug}); 
                } catch (e) { console.error(e); Swal.fire('Error', 'No se pudo enviar la reseña.', 'error'); }
            }
        };


// --- MEGA MENÚ MANAGER (CON ACTUALIZACIÓN EN TIEMPO REAL) ---
window.megaMenuManager = {
    isInitialized: false,
    
    // Función para limpiar y redibujar cuando cambian los datos
    refresh: () => {
        const listContainer = document.getElementById('mm-categories-list');
        if (!listContainer) return;
        
        // 1. Limpiamos el contenido actual
        listContainer.innerHTML = ''; 
        // 2. Reseteamos el bloqueo
        megaMenuManager.isInitialized = false; 
        // 3. Volvemos a iniciar (esto redibuja con las nuevas categorías)
        megaMenuManager.init();
    },

    init: () => {
        // Si no hay categorías o ya está dibujado (y no hemos pedido refresh), no hacemos nada
        if (CATEGORIES.length === 0 || megaMenuManager.isInitialized) return;

        const listContainer = document.getElementById('mm-categories-list');
        if (!listContainer) return;

        // --- DIBUJAR CATEGORÍAS ---
        listContainer.innerHTML = CATEGORIES.map((cat, index) => {
            const isActive = index === 0; 
            if(isActive) setTimeout(() => megaMenuManager.showPreview(cat.name), 50);

            return `
            <div onmouseenter="megaMenuManager.showPreview('${cat.name}')" 
                 class="mm-cat-item px-6 py-3 cursor-pointer flex justify-between items-center text-sm font-bold transition-all duration-200 hover:bg-white hover:text-[#26E4ED] hover:border-l-4 hover:border-[#00979D] ${isActive ? 'bg-white text-slate-900 border-l-4 border-[#00979D]' : 'text-slate-500 border-l-4 border-transparent'}">
                <span>${cat.name}</span>
                <i class="ph-bold ph-caret-right text-xs opacity-50"></i>
            </div>`;
        }).join('');
        
        listContainer.innerHTML += `
            <div onclick="router.navigate('/shop')" class="px-6 py-3 mt-2 cursor-pointer text-xs font-bold text-blue-600 hover:underline border-t border-slate-200">
                Ver Catálogo Completo
            </div>
        `;

        megaMenuManager.isInitialized = true;
    },

    showPreview: (categoryName) => {
        // Actualizar estilos visuales de la lista
        const items = document.querySelectorAll('.mm-cat-item');
        items.forEach(el => {
            // Usamos textContent para comparar porque innerText puede variar según estilos
            if(el.textContent.trim().includes(categoryName)) {
                el.classList.remove('text-slate-500', 'border-transparent');
                el.classList.add('bg-white', 'text-slate-900', 'border-[#00979D]');
            } else {
                el.classList.add('text-slate-500', 'border-transparent');
                el.classList.remove('bg-white', 'text-slate-900', 'border-[#00979D]');
            }
        });

        const products = PRODUCTS.filter(p => p.category === categoryName).slice(0, 6);
        const container = document.getElementById('mm-products-preview');
        const btn = document.getElementById('mm-view-all-btn');

        if(btn) btn.onclick = () => router.navigate('/shop', {category: categoryName, pageNum: 1});
        if(!container) return;

        if (products.length === 0) {
            container.innerHTML = `<div class="col-span-3 flex flex-col items-center justify-center h-full text-slate-400 opacity-50"><i class="ph-fill ph-ghost text-4xl mb-2"></i><p class="text-sm">Sin productos por ahora</p></div>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div onclick="router.navigate('product', {product: '${p.slug}'})" class="group cursor-pointer bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-[#00979D] hover:shadow-md transition-all duration-300 flex flex-col h-[140px]">
                <div class="flex-1 w-full flex items-center justify-center overflow-hidden mb-2 bg-white rounded-lg p-1">
                    <img src="${p.image}" class="h-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply">
                </div>
                <div>
                    <h4 class="text-[10px] font-bold text-slate-700 leading-tight line-clamp-1 group-hover:text-black mb-1">${p.name}</h4>
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-extrabold text-slate-900">S/ ${p.isOffer ? p.offerPrice : p.price}</span>
                        ${p.isOffer ? '<span class="text-[8px] bg-red-500 text-white px-1 rounded font-bold">-Oferta</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.classList.remove('fade-in');
        void container.offsetWidth; 
        container.classList.add('fade-in');
    }
};


// --- AGREGAR ESTO DENTRO DEL SCRIPT, JUNTO A TUS OTRAS FUNCIONES WINDOW ---

window.initScrollAnimations = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Añadimos la clase para activar la animación
                entry.target.classList.add('reveal-visible');
                // Dejamos de observar para que no se anime doble vez
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1, // Se activa cuando se ve el 10% del producto
        rootMargin: "0px 0px -50px 0px" // Un pequeño margen para que no aparezca pegado al borde
    });

    // Buscar todos los elementos con la clase y observarlos
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        observer.observe(el);
    });
};




window.clickAdPopup = () => {
    // AQUI ES DONDE FALLABA ANTES POR FALTA DE LA VARIABLE
    if(POPUP_LINK && POPUP_LINK !== '#') { 
        closeAdPopup();
        if(POPUP_LINK.startsWith('/') || POPUP_LINK.startsWith('?')) {
            if(POPUP_LINK.includes('?page=product')) {
                const urlParams = new URLSearchParams(POPUP_LINK.split('?')[1]);
                router.navigate('product', {product: urlParams.get('product')});
            } else if(POPUP_LINK.includes('/shop')) {
                router.navigate('/shop');
            } else {
                window.location.href = POPUP_LINK;
            }
        } else {
            window.open(POPUP_LINK, '_blank');
        }
    } else {
        closeAdPopup(); // Si no hay link, solo cierra
    }
};



// REEMPLAZA ESTA FUNCIÓN EN Perúnuevo.html

window.showAdPopup = (imageUrl, linkUrl, title, message, btnText) => {
    const modal = document.getElementById('ad-popup-modal');
    const img = document.getElementById('ad-popup-img');
    const content = document.getElementById('ad-popup-content');
    const backdrop = document.getElementById('ad-popup-backdrop');
    
    // Referencias a textos
    const textContainer = document.getElementById('ad-text-container');
    const titleEl = document.getElementById('ad-popup-title');
    const msgEl = document.getElementById('ad-popup-msg');
    const btnLabel = document.getElementById('ad-btn-label');
    const imgWrapper = document.getElementById('ad-img-wrapper');

    // 1. Configurar Imagen y Link
    img.src = imageUrl;
    POPUP_LINK = linkUrl;

    // 2. Lógica de Texto: ¿Mostramos la parte blanca de abajo o no?
    const hasText = (title && title.trim() !== '') || (message && message.trim() !== '');

    if (hasText) {
        // MODO CON TEXTO (Estilo Card)
        textContainer.classList.remove('hidden');
        titleEl.innerText = title || '';
        msgEl.innerText = message || '';
        btnLabel.innerText = btnText || 'Ver Detalles';
        
        // Ajuste de imagen para compartir espacio
        img.className = "w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105";
        content.classList.replace('max-w-3xl', 'max-w-md'); // Más angosto para leer mejor
    } else {
        // MODO SOLO IMAGEN (Estilo Poster completo)
        textContainer.classList.add('hidden');
        
        // Imagen grande sin restricciones de altura forzadas por texto
        img.className = "w-full h-auto max-h-[85vh] object-contain mx-auto rounded-2xl";
        // Fondo transparente para que parezca flotar solo la imagen
        content.classList.remove('bg-white', 'shadow-2xl'); 
        content.classList.add('bg-transparent', 'shadow-none');
        imgWrapper.classList.add('rounded-2xl', 'shadow-2xl', 'overflow-hidden');
    }

    // 3. Mostrar Modal
    modal.classList.remove('hidden');
    void modal.offsetWidth; // Force Reflow

    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 10);
};
window.closeAdPopup = () => {
    const modal = document.getElementById('ad-popup-modal');
    const content = document.getElementById('ad-popup-content');
    const backdrop = document.getElementById('ad-popup-backdrop');
    
    // Animación de Salida
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0'); // Se encoge ligeramente al salir
    
    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');
    
    // Esperar a que termine la animación (500ms) para ocultar el div
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('ad-popup-img').src = ""; // Limpiar imagen
    }, 500);
};




window.initBannerEffects = () => {
    const container = document.querySelector('.group\\/banner'); 
    if (!container) return;

    window.isBannerHovered = false;
    let ticking = false; // Variable para controlar el frame rate

    // --- 1. MOUSE ENTER/LEAVE (Sin cambios drásticos) ---
    container.addEventListener('mouseenter', () => {
        window.isBannerHovered = true; 
        if (window.bannerInterval) clearInterval(window.bannerInterval);
    });

    container.addEventListener('mouseleave', () => {
        window.isBannerHovered = false;
        if (window.bannerInterval) clearInterval(window.bannerInterval);
        window.bannerInterval = setInterval(() => window.moveBanner(1), 6000);

        const activeSlide = document.getElementById(`banner-slide-${window.currentBannerIndex}`);
        if (activeSlide) {
            const img = activeSlide.querySelector('.banner-3d-target');
            if(img) {
                // Reseteamos estilos directamente
                img.style.transform = 'translateY(0) scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg)';
            }
        }
    });

    // --- 2. MOUSE MOVE (Optimizado con requestAnimationFrame) ---
    container.addEventListener('mousemove', (e) => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const activeSlide = document.getElementById(`banner-slide-${window.currentBannerIndex}`);
                if (activeSlide) {
                    const img = activeSlide.querySelector('.banner-3d-target');
                    if (img) {
                        const rect = container.getBoundingClientRect();
                        const x = e.clientX - rect.left; 
                        const y = e.clientY - rect.top;
                        const xPct = (x / rect.width - 0.5) * 2; 
                        const yPct = (y / rect.height - 0.5) * 2;
                        
                        // Usamos transform directamente (más rápido que setProperty para animaciones continuas)
                        const rotX = yPct * -10;
                        const rotY = xPct * 10;
                        
                        // Aplicamos todas las transformaciones en una sola línea para evitar reflows
                        img.style.transform = `translateY(var(--scroll-y, 0px)) scale(var(--scroll-scale, 1)) perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
                    }
                }
                ticking = false;
            });
            ticking = true;
        }
    });

    // --- 3. SCROLL (Optimizado con requestAnimationFrame) ---
    // Movemos la lógica del scroll fuera del listener directo
    let scrollTicking = false;
    
    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const activeSlide = document.getElementById(`banner-slide-${window.currentBannerIndex}`);
                if (activeSlide) {
                    const img = activeSlide.querySelector('.banner-3d-target');
                    if (img) {
                        const scrollY = window.scrollY;
                        // Solo calculamos si el banner está visible (ahorra recursos)
                        if (scrollY < 800) { 
                            const moveY = scrollY * 0.15; 
                            const scale = 1 + (scrollY / 4000); 
                            
                            // Actualizamos variables CSS o transform directo
                            img.style.setProperty('--scroll-y', `${moveY}px`);
                            img.style.setProperty('--scroll-scale', `${scale}`);
                            
                            // Nota: drop-shadow es muy pesado. Considera desactivarlo al hacer scroll si sigue lento.
                            // img.style.setProperty('--drop-shadow-y', `${20 + (scrollY * 0.1)}px`);
                        }
                    }
                }
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }, { passive: true }); // 'passive: true' le dice al navegador que no vamos a cancelar el scroll, haciéndolo más fluido
};

window.router = {
            navigate: (p, params = {}) => {
                let url = `?page=${p.replace('/','') || 'home'}`;
                Object.keys(params).forEach(k => url += `&${k}=${params[k]}`);
                window.history.pushState({}, '', url); 
                router.handle(true); 
            },
            handle: (doScroll = true) => {
                const params = new URLSearchParams(window.location.search);
                const page = params.get('page') || 'home';
                const app = document.getElementById('app');
                const header = document.getElementById('main-header');
                const footer = document.getElementById('main-footer');
                
                if (doScroll) window.scrollTo(0,0);

// --- LÓGICA CORREGIDA PARA ILUMINAR EL MENÚ ACTIVO ---
                const highlightMenu = () => {
                    const map = {
                        'home': 'nav-home',
                        'shop': 'nav-shop', 'product': 'nav-shop',
                        'faq': 'nav-faq',
                        'how-to-buy': 'nav-how-to-buy',
                        'about': 'nav-about',
                        'services': 'nav-services'
                    };
                    
                    const params = new URLSearchParams(window.location.search);
                    const page = params.get('page') || 'home';
                    const activeId = map[page] || 'nav-home';

                    // Reseteamos todos y activamos el correcto
                    Object.values(map).forEach(id => {
                        const el = document.getElementById(id);
                        if(!el) return;

                        const textSpan = el.querySelector('span'); // El texto
                        const lineDiv = el.querySelector('div:last-child'); // La línea de abajo

                        if(id === activeId) {
                            // ESTADO ACTIVO (ESTOY EN ESTA PÁGINA)
                            // 1. Quitamos el blanco para que no estorbe
                            textSpan.classList.remove('text-white', 'tracking-widest');
                            
                            // 2. Ponemos el color Arduino (#00979D) y el brillo
                            textSpan.classList.add('text-[#1CE8DE]', 'tracking-[0.25em]', 'drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]');
                            
                            // Mostramos la línea de abajo
                            lineDiv.classList.remove('w-0', 'opacity-0');
                            lineDiv.classList.add('w-full', 'opacity-100');
                        } else {
                            // ESTADO INACTIVO (NO ESTOY AQUÍ)
                            // 1. Ponemos el texto en BLANCO (Nuevo cambio)
                            textSpan.classList.add('text-white', 'tracking-widest');
                            
                            // 2. Quitamos el color Arduino
                            textSpan.classList.remove('text-[#1CE8DE]', 'tracking-[0.25em]', 'drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]');
                            
                            // Ocultamos la línea
                            lineDiv.classList.add('w-0', 'opacity-0');
                            lineDiv.classList.remove('w-full', 'opacity-100');
                        }
                    });
                };           
                // Ejecutamos la iluminación del menú
                highlightMenu();
                // --------------------------------------------------

                if(page === 'login') { 
                    header.style.display = 'none'; footer.style.display = 'none'; 
                    app.className = "w-full fade-in";

} else { 
    header.style.display = 'block'; footer.style.display = 'block'; 
    
    // CAMBIO IMPORTANTE: Si es home, quitamos el padding (p-0). Si no, lo dejamos.
// CAMBIO: Ahora 'services' también ocupa todo el ancho (p-0)
    if (page === 'home' || page === 'services') {
        app.className = "flex-grow w-full fade-in min-h-[60vh] p-0"; 
    } else {
        app.className = "flex-grow w-full fade-in min-h-[60vh] px-4 py-6";
    }
}

                if(page === 'home') renderHome(app);
                else if(page === 'shop') renderShop(app, params.get('category'), parseInt(params.get('pageNum') || 1), params.get('filter'), params.get('search'));
                else if(page === 'product') renderProduct(app, params.get('product'));
                else if(page === 'login') renderLogin(app);
                else if(page === 'faq') renderFAQ(app);
                else if(page === 'how-to-buy') renderHowToBuy(app);
                else if(page === 'about') renderAbout(app);
else if(page === 'services') renderServices(app);
else if(page === 'profile') {
    if(!state.user && !auth.currentUser) { router.navigate('/login'); return; }
    // AQUI EL CAMBIO: Si 'tab' es nulo, forzamos 'summary'
    renderProfile(app, params.get('tab') || 'summary');
}



            }
        };


function ProductCard(p) {
    // --- PEGAR ESTO AL INICIO DE LA FUNCIÓN ---
    let restockMsg = null;
    
    if (p.stock <= 0 && p.restockDate) {
        const today = new Date();
        today.setHours(0,0,0,0); // Ignorar hora actual
        
        // Corregir la fecha del admin (a veces viene con zona horaria distinta)
        const parts = p.restockDate.split('-');
        const target = new Date(parts[0], parts[1] - 1, parts[2]); 
        
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 0) {
            restockMsg = `Llega en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            restockMsg = "¡Llega Hoy!";
        }
    }
    // ------------------------------------------

    // ... (el resto de tu código original: isNew, isFav, etc) ...
    
    let isNew = false;
    
    // Lógica para detectar si es nuevo (mantenemos tu lógica original)
    if (p.newMode === 'forced_on') isNew = true;
    else if (p.newMode === 'forced_off') isNew = false;
    else if (p.date) {
        const diffDays = Math.abs(new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) isNew = true;
    }

    const isFav = state.favorites.has(p.id);
    const finalPrice = (p.isOffer && p.offerPrice) ? p.offerPrice : p.price;
    const originalPrice = (p.isOffer && p.offerPrice) ? p.price : (p.price * 1.2);
    const stock = p.stock || 0;
    const isStock = stock > 0;
    const isLowStock = stock > 0 && stock <= 5;
    
    const dotColorClass = isLowStock ? 'bg-red-500' : 'bg-emerald-500';

    return `
    <div class="group relative w-full h-full rounded-[14px] bg-slate-200 p-[1px] overflow-hidden isolate shadow-sm hover:shadow-xl transition-shadow duration-500">
        
        <div class="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#0f172a_360deg)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_3s_linear_infinite] z-0"></div>

        <div class="relative w-full h-full bg-white rounded-[13px] overflow-hidden z-10 flex flex-col">









<div class="relative w-full aspect-[1/1] overflow-hidden bg-white border-b border-slate-200 cursor-pointer group rounded-t-[14px]" onclick="router.navigate('product', {product: '${p.slug}'})">
                
                <div class="absolute inset-0 bg-white"></div>

                <div class="absolute -bottom-[60%] -right-[20%] w-[140%] h-[140%] rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 z-0 transition-transform duration-700 group-hover:scale-105 shadow-[inset_0_1px_10px_rgba(0,0,0,0.05)]"></div>

                <div class="absolute -bottom-[60%] -right-[20%] w-[140%] h-[140%] rounded-full border border-slate-300/50 pointer-events-none z-0"></div>

                <div class="absolute -bottom-[55%] -right-[15%] w-[130%] h-[130%] rounded-full border border-slate-300/40 z-0"></div>
                <div class="absolute -bottom-[50%] -right-[10%] w-[120%] h-[120%] rounded-full border border-[#00979D]/20 z-0 group-hover:border-[#00979D]/50 transition-colors duration-300"></div>

   <div class="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-300 rounded-full shadow-inner z-0 group-hover:translate-y-2 transition-transform duration-1000 border border-slate-200 flex items-center justify-center p-2">
    <img src="https://qeoojbsrqlroajvdgrju.supabase.co/storage/v1/object/public/productos/2MTECHPERU%20logo.png" 
         class="w-full h-full object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
</div>
                <div class="absolute top-2 left-2 z-30 flex flex-col gap-1 items-start pointer-events-none">
                    ${p.isOffer ? `
                        <span class="pl-2 pr-3 py-0.5 rounded-md bg-red-600 text-white border border-red-500 text-[8px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1 z-20">
                            <i class="ph-fill ph-lightning text-[10px] flex-shrink-0"></i> -${Math.round(100 - ((finalPrice * 100) / originalPrice))}%
                        </span>
                    ` : ''}

${isNew ? `
                        <span class="px-3 py-1.5 rounded bg-slate-800 text-white text-[9px] font-bold uppercase tracking-[0.25em] z-20 shadow-sm">
                            NUEVO
                        </span>
                    ` : ''}

  ${p.points ? `
    <span class="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 z-20">
        <i class="ph-fill ph-star text-orange-500 text-[11px]"></i>
        +${p.points}
    </span>
` : ''}

                    
                </div>

                <button onclick="event.stopPropagation(); userActions.toggleFavorite('${p.id}')" 
                    class="absolute top-2 right-2 z-30 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 border ${isFav ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:shadow-md'}">
                    <i class="${isFav ? 'ph-fill' : 'ph-bold'} ph-heart text-sm"></i>
                </button>
                
                <div class="relative w-full h-full p-6 z-10 flex items-center justify-center transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-110">
                    <img src="${p.image}" class="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.2)] ${!isStock ? 'grayscale opacity-50' : ''}" loading="lazy" alt="${p.name}">
                </div>

                ${!isStock ? `
                    <div class="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                        ${restockMsg ? 
                            `<div class="text-center transform rotate-[-5deg]">
                                <span class="bg-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-xl border-2 border-orange-600 block mb-1">
                                    PRONTO
                                </span>
                                <span class="text-[10px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm whitespace-nowrap">
                                    ${restockMsg}
                                </span>
                            </div>` 
                            : 
                            `<span class="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest shadow-lg border border-slate-800">Agotado</span>`
                        }
                    </div>
                ` : ''}

            </div>
     















            
            <div class="p-2.5 flex flex-col flex-grow relative bg-[#F8FAFC]">
                <div class="flex justify-between items-center mb-0.5"> 
                    <span class="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider truncate max-w-[100px]">
                        ${p.category}
                    </span>
                    
                    ${isStock ? `
                        <div class="flex items-center gap-1">
                            <span class="relative flex h-1.5 w-1.5">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorClass}"></span>
                              <span class="relative inline-flex rounded-full h-1.5 w-1.5 ${dotColorClass}"></span>
                            </span>
                            <span class="text-[8px] font-bold ${isLowStock ? 'text-red-600' : 'text-emerald-600'}">
                                ${isLowStock ? `Quedan ${stock}` : 'Disponible'}
                            </span>
                        </div>
                    ` : ''}
                </div>

                <h3 class="text-xs font-bold text-slate-900 leading-snug min-h-[2rem] line-clamp-2 cursor-pointer group-hover:text-indigo-600 transition-colors duration-300" onclick="router.navigate('product', {product: '${p.slug}'})" title="${p.name}">
                    ${p.name}
                </h3>
            </div>

            <div class="mt-auto px-2.5 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 relative z-20">
                <div class="flex flex-col">
                     <span class="text-[8px] font-black uppercase tracking-widest ${p.isOffer ? 'text-red-600' : 'text-slate-500'}">
                        ${p.isOffer ? 'OFERTA' : 'PRECIO'}
                    </span>
                    
                    <div class="flex flex-col leading-none">
                        <div class="flex items-end gap-0.5">
                            <span class="text-[10px] font-bold mb-0.5 ${p.isOffer ? 'text-red-600' : 'text-slate-600'}">S/</span>
                            <span class="text-lg font-black tracking-tighter ${p.isOffer ? 'text-red-600' : 'text-slate-900'}">
                                ${finalPrice.toFixed(0)}<span class="text-xs font-bold opacity-70 align-top ml-px">.${finalPrice.toFixed(2).split('.')[1]}</span>
                            </span>
                        </div>
                        
                        ${p.isOffer ? `
                            <span class="text-[8px] font-bold text-slate-400 line-through decoration-slate-300 -mt-0.5">
                                S/ ${originalPrice.toFixed(2)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <button onclick="event.stopPropagation(); ${isStock ? `cartManager.add('${p.id}')` : ''}" 
                    class="relative w-8 h-8 flex items-center justify-center overflow-hidden group/btn z-10 shadow-md shadow-slate-300 transition-all duration-300 hover:scale-105 active:scale-95
                    ${isStock ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}" 
                    style="border-radius: 8px;" 
                    title="${isStock ? 'Agregar' : 'Sin Stock'}">
                    
                    ${isStock ? `
                        <div class="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover/btn:-translate-y-full">
                            <i class="ph-fill ph-shopping-cart-simple text-base"></i>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center translate-y-full transition-transform duration-300 group-hover/btn:translate-y-0 bg-slate-800 text-white">
                            <i class="ph-bold ph-plus text-base"></i>
                        </div>
                    ` : '<i class="ph-bold ph-prohibit text-base"></i>'}
                </button>
            </div>
        </div>
    </div>`;
}
        window.currentBannerIndex = 0;
        window.totalBanners = 0;



window.moveBanner = (step) => {
    if (window.totalBanners <= 1) return;

    // 1. OCULTAR SLIDE ACTUAL
    const prevSlide = document.getElementById(`banner-slide-${window.currentBannerIndex}`);
    const prevText = document.getElementById(`banner-text-${window.currentBannerIndex}`);
    const prevInd = document.getElementById(`indicator-${window.currentBannerIndex}`);
    
    if(prevSlide) {
        prevSlide.classList.replace('opacity-100', 'opacity-0');
        prevSlide.classList.remove('glitch-active');
    }
    if(prevText) { 
        prevText.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto'); 
        prevText.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none'); 
    }
    if(prevInd) { 
        prevInd.classList.remove('bg-[#00979D]', 'w-8'); 
        prevInd.classList.add('bg-slate-500', 'w-4'); 
    }

    // 2. CALCULAR NUEVO ÍNDICE
    window.currentBannerIndex = (window.currentBannerIndex + step + window.totalBanners) % window.totalBanners;

    // 3. MOSTRAR NUEVO SLIDE
    const nextSlide = document.getElementById(`banner-slide-${window.currentBannerIndex}`);
    const nextText = document.getElementById(`banner-text-${window.currentBannerIndex}`);
    const nextInd = document.getElementById(`indicator-${window.currentBannerIndex}`);
    
    if(nextSlide) {
        nextSlide.classList.replace('opacity-0', 'opacity-100'); 
        
        // Efecto Glitch
        nextSlide.classList.add('glitch-active');
        setTimeout(() => {
            if(nextSlide) nextSlide.classList.remove('glitch-active');
        }, 500);
    }
    if(nextText) { 
        setTimeout(() => {
            nextText.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none'); 
            nextText.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto'); 
        }, 300);
    }
    if(nextInd) { 
        nextInd.classList.remove('bg-slate-500', 'w-4'); 
        nextInd.classList.add('bg-[#00979D]', 'w-8'); 
    }

    // 4. LÓGICA INTELIGENTE DE REINICIO
    // Limpiamos el intervalo actual siempre
    if (window.bannerInterval) clearInterval(window.bannerInterval);

    // SOLO reiniciamos el contador automático si el mouse NO está encima
    if (!window.isBannerHovered) {
        window.bannerInterval = setInterval(() => window.moveBanner(1), 6000);
    }
};



// --- EFECTO MÁQUINA DE ESCRIBIR PARA LA PORTADA ---
window.bubbleInterval = null;

window.startTypewriter = (elementId, text) => {
    const bubble = document.getElementById(elementId);
    const contentSpan = bubble.querySelector('.bubble-text');
    
    if(!bubble || !contentSpan) return;

    // 1. Mostrar la burbuja
    bubble.classList.add('bubble-visible');
    contentSpan.innerText = ""; // Limpiar texto anterior
    
    // 2. Iniciar escritura
    let i = 0;
    if (window.bubbleInterval) clearInterval(window.bubbleInterval);
    
    window.bubbleInterval = setInterval(() => {
        if (i < text.length) {
            contentSpan.innerText += text.charAt(i);
            i++;
        } else {
            clearInterval(window.bubbleInterval);
        }
    }, 50); // Velocidad de escritura (ms)
};

window.stopTypewriter = (elementId) => {
    const bubble = document.getElementById(elementId);
    if (window.bubbleInterval) clearInterval(window.bubbleInterval);
    if(bubble) bubble.classList.remove('bubble-visible');
};

function renderHome(container) {


    const offerProducts = PRODUCTS.filter(p => p.isOffer);
    const loopOffers = offerProducts.length > 0 ? [...offerProducts, ...offerProducts, ...offerProducts, ...offerProducts] : [];
    const displayOffers = loopOffers.slice(0, 20);
    // 2. NUEVO: FILTRO DE PRODUCTOS NUEVOS
    // Usamos la misma lógica que tu tarjeta: menos de 7 días o forzado "ON"
const newProducts = PRODUCTS.filter(p => {
        // Si está forzado a NO ser nuevo, lo ignoramos
        if (p.newMode === 'forced_off') return false;
        
        // Si está forzado a SÍ ser nuevo, entra
        if (p.newMode === 'forced_on') return true;

        // Si es automático, debe tener 3 días o menos (Igual que tu etiqueta)
        if (p.date) {
            const diffDays = Math.abs(new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24);
            return diffDays <= 3; 
        }
        return false;
    });

    if (window.bannerInterval) clearInterval(window.bannerInterval);




// --- LÓGICA DE ORDENAMIENTO INTELIGENTE (VISTAS + DESEMPATE) ---
        const sortedByViews = [...PRODUCTS].sort((a, b) => {
            // 1. Obtener vistas (si no tiene, es 0)
            const viewsA = parseInt(a.views || 0);
            const viewsB = parseInt(b.views || 0);
            
            // 2. CRITERIO PRINCIPAL: Mayor cantidad de vistas gana
            if (viewsB !== viewsA) {
                return viewsB - viewsA;
            }

            // 3. CRITERIO DE DESEMPATE (Si tienen mismas vistas):
            // Ganará el que sea más nuevo (por fecha)
            const dateA = new Date(a.date || 0);
            const dateB = new Date(b.date || 0);
            
            return dateB - dateA; 
        });

        // Tomamos los 5 primeros productos ganadores
        const productsHTML = sortedByViews.length 
            ? sortedByViews.slice(0, 5).map(ProductCard).join('') 
            : '<div class="col-span-full text-center py-8 text-slate-400">Cargando destacados...</div>';
        // -----------------------------------------------------------

// 1. PORTADA FIJA (ESTRATEGIA: SERVICIOS, PROYECTOS Y PRODUCTOS)
    const fixedHero = {
        type: 'fixed-split',
        title: '2M Tech Perú', 
        subtitle: 'ELECTRÓNICA & SERVICIO', 
        
        // DESCRIPCIÓN PRINCIPAL (ENGANCHE):
        // Vende la solución completa: no solo vendes piezas, ayudas a crear.
        desc: 'Encuentra los mejores componentes, solicita nuestro servicio técnico especializado o cotiza el desarrollo integral de tus proyectos. ¡Haz realidad tus ideas hoy!',
        
        // LAS 3 IMÁGENES FLOTANTES (TUS 3 PILARES):
        products: [
            { 
                name: 'Servicios', 
                img: 'https://iili.io/fu69Aog.png', // Imagen Izquierda
                link: '/services',
                // TEXTO BURBUJA (SERVICIOS):
                msg: '¡Instalaciones eléctricas y mucho más!' 
            }, 
            { 
                name: 'Proyectos', 
                img: 'https://iili.io/fu69rib.png', // Imagen Central (La más grande)
                link: '/contact', // Idealmente llevaría a contacto/cotización
                // TEXTO BURBUJA (PROYECTOS):
                msg: 'Desarrollo de proyectos con microcontroladores de Microchip, STM32, Arduino, Raspberry y mucho más. 🚀' 
            },
            { 
                name: 'Productos', 
                img: 'https://iili.io/fufkICG.png', // Imagen Derecha
                link: '/shop',
                // TEXTO BURBUJA (PRODUCTOS):
                msg: 'Componentes y Herramientas A1 a un buen precio. ⚡' 
            }
        ]
    };

    // 2. JUNTARLO CON LA DATA DE FIREBASE (Fijo va primero)
// 2. JUNTARLO CON LA DATA DE FIREBASE (Fijo va primero)
    let banners = [fixedHero]; 
    if (BANNER_DATA) {
        let dbBanners = [];
        
        // Convertir a array si no lo es
        if(Array.isArray(BANNER_DATA)) { 
            dbBanners = BANNER_DATA; 
        } else if (BANNER_DATA.image) { 
            dbBanners = [BANNER_DATA]; 
        }
        
        // --- FILTRO DE VISIBILIDAD ---
        // Solo agregamos al carrusel los que NO tengan isVisible = false
        const visibleBanners = dbBanners.filter(b => b.isVisible !== false);
        
        banners = banners.concat(visibleBanners);
    }

    window.totalBanners = banners.length;
    window.currentBannerIndex = 0;



    

// GENERACIÓN DE SLIDES (MODIFICADO PARA FULL WIDTH)
    const carouselHTML = banners.map((b, index) => {
        // --- PEGAR ESTO AL INICIO DEL MAP ---
        const isActiveState = index === 0 ? 'opacity-100 pointer-events-auto active-slide' : 'opacity-0 pointer-events-none';
        

if (b.type === 'fixed-split') {
    return `
    <div id="banner-slide-${index}" class="absolute inset-0 w-full h-full bg-slate-900 ${isActiveState} overflow-hidden">
        
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1e293b] via-[#0f172a] to-black"></div>
        <div class="absolute inset-0 opacity-20" style="background-image: linear-gradient(#00979D 1px, transparent 1px), linear-gradient(90deg, #00979D 1px, transparent 1px); background-size: 40px 40px;"></div>

        <div class="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-6 h-full flex flex-col md:flex-row items-center">
            
            <div id="banner-text-${index}" class="w-full md:w-5/12 flex flex-col justify-center text-center md:text-left pt-20 md:pt-0 z-20 pointer-events-auto">
                
                <div class="anim-left" style="animation-delay: 0.3s">
                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00979D] bg-[#00979D]/10 text-[#26E4ED] font-bold tracking-[0.2em] uppercase text-[10px] mb-4 shadow-[0_0_15px_rgba(0,151,157,0.5)]">
                        <span class="w-2 h-2 rounded-full bg-[#00979D] animate-pulse"></span> ${b.subtitle}
                    </span>
                </div>

                <h2 class="anim-sky text-5xl md:text-7xl font-black text-white leading-[0.9] mb-6 tracking-tighter drop-shadow-2xl" style="animation-delay: 0.5s">
                    ${b.title.split(' ')[0]}<br>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">${b.title.split(' ').slice(1).join(' ')}</span>
                </h2>

                <p class="anim-left text-slate-400 text-sm md:text-base mb-8 max-w-md mx-auto md:mx-0 leading-relaxed font-medium" style="animation-delay: 0.7s">
                    ${b.desc}
                </p>

            </div>

            <div class="w-full md:w-7/12 h-full relative flex items-center justify-center pointer-events-none mt-10 md:mt-0">
                
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00979D] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>

                <div class="absolute left-0 md:left-10 top-1/2 -translate-y-1/2 z-10 w-32 md:w-48 pointer-events-auto float-delay-2 group">
                    <div id="bubble-left" class="thought-bubble">
                        <span class="bubble-text"></span><span class="cursor-blink"></span>
                    </div>
                    
                    <img src="${b.products[0].img}" 
                         onmouseenter="startTypewriter('bubble-left', '${b.products[0].msg}')"
                         onmouseleave="stopTypewriter('bubble-left')"
                         onclick="imageModalManager.open(this.src)"
                         class="floating-img w-full object-contain hover:rotate-[-10deg] cursor-pointer">
                    
                    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        ${b.products[0].name}
                    </div>
                </div>

                <div class="absolute right-0 md:right-10 top-20 md:top-1/3 z-10 w-28 md:w-40 pointer-events-auto float-delay-3 group">
                    <div id="bubble-right" class="thought-bubble">
                        <span class="bubble-text"></span><span class="cursor-blink"></span>
                    </div>

                    <img src="${b.products[2].img}" 
                         onmouseenter="startTypewriter('bubble-right', '${b.products[2].msg}')"
                         onmouseleave="stopTypewriter('bubble-right')"
                         onclick="imageModalManager.open(this.src)"
                         class="floating-img w-full object-contain hover:rotate-[10deg] cursor-pointer">

                    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        ${b.products[2].name}
                    </div>
                </div>

                <div class="relative z-20 w-64 md:w-96 pointer-events-auto float-delay-1 group">
                    <div id="bubble-center" class="thought-bubble" style="bottom: 105%; left: 60%;">
                        <span class="bubble-text"></span><span class="cursor-blink"></span>
                    </div>

                    <img src="${b.products[1].img}" 
                         onmouseenter="startTypewriter('bubble-center', '${b.products[1].msg}')"
                         onmouseleave="stopTypewriter('bubble-center')"
                         onclick="imageModalManager.open(this.src)"
                         class="floating-img w-full object-contain drop-shadow-2xl cursor-pointer">
                    
                    <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        ${b.products[1].name}
                    </div>
                </div>

            </div>
        </div>
    </div>`;
}

        const isActive = index === 0 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none';
        const hasButton = b.btnText && b.btnText.trim() !== "";

// --- MODO 1: PRODUCTO FLOTANTE 3D (OPTIMIZADO: SIN LAG + TEXTURA METAL) ---
        if (b.is3D) {
            return `
            <div id="banner-slide-${index}" class="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out ${isActive} bg-slate-100 overflow-hidden">
                
                <div class="absolute inset-0 z-0 opacity-[0.4]" 
                     style="background-image: linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px); background-size: 40px 40px;">
                </div>
                
                <div class="absolute inset-0 z-0 bg-gradient-to-br from-white/80 via-transparent to-slate-300/50 pointer-events-none"></div>

                <div class="absolute top-0 bottom-0 right-0 w-[55%] md:w-[50%] z-0 bg-gradient-to-b from-slate-800 to-slate-900" 
                     style="clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);">
                     
                     <div class="absolute inset-0 opacity-10" 
                          style="background-image: radial-gradient(#ffffff 1px, transparent 1px); background-size: 20px 20px;">
                     </div>
                </div>

                <div class="absolute top-0 bottom-0 right-0 w-[55%] md:w-[50%] z-10 bg-[#00979D]" 
                     style="clip-path: polygon(20% 0, 20.3% 0, 0.3% 100%, 0% 100%); box-shadow: 0 0 15px #00979D;">
                </div>

                <div class="absolute inset-0 w-full max-w-[1440px] mx-auto px-4 md:px-6 h-full flex items-center">
                    
                    <div class="grid grid-cols-12 w-full h-full items-center">
                        
                        <div class="col-span-12 md:col-span-6 lg:col-span-6 relative z-20 flex flex-col justify-center pl-4 md:pl-10 pr-4">
                            
                            <div id="banner-text-${index}" class="transition-all duration-700 ease-out ${index === 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}">
                                
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-white border border-slate-200 shadow-sm mb-6 w-fit">
                                    <span class="relative flex h-2 w-2">
                                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00979D] opacity-75"></span>
                                      <span class="relative inline-flex rounded-full h-2 w-2 bg-[#00979D]"></span>
                                    </span>
                                    <span class="text-slate-800 text-[10px] font-bold uppercase tracking-[0.2em]">${b.badge || 'DESTACADO'}</span>
                                </div>

                                <h2 class="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 mb-6 leading-[0.95] tracking-tight">
                                    ${b.title || 'TechPerú'}
                                </h2>
                                
                                <p class="text-base md:text-lg text-slate-600 mb-8 font-medium leading-relaxed border-l-4 border-[#00979D] pl-4 max-w-md">
                                    ${b.subtitle || ''}
                                </p>
                                
                                ${hasButton ? `
                                <div class="flex flex-col sm:flex-row gap-4">
                                    <button onclick="window.history.pushState({}, '', '${b.btnLink || '?page=shop'}'); router.handle(true);" class="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-[#00979D] hover:text-slate-900 transition-colors shadow-xl flex items-center justify-center gap-3 w-fit group">
                                        <span>${b.btnText}</span>
                                        <i class="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    </button>
                                </div>` : ''}
                            </div>
                        </div>

                        <div class="col-span-12 md:col-span-6 lg:col-span-6 relative h-full flex items-center justify-center pointer-events-none">
                            
                            <div class="absolute w-[300px] h-[300px] bg-[#00979D] rounded-full opacity-20 blur-[80px]"></div>

                            <img src="${b.image}" 
                                 class="banner-3d-target relative z-30 w-[85%] max-w-[500px] object-contain drop-shadow-2xl transform transition-transform will-change-transform">
                        </div>

                    </div>
                </div>
            </div>`;
        }
        
// --- MODO 2: BANNER NORMAL (FOTO COMPLETA) ---
        else {
            // 1. DETECTAR SI EL ADMIN ESCRIBIÓ TEXTO
            // Si título, subtítulo y botón están vacíos, asumimos que es "Solo Imagen"
            const hasContent = (b.title && b.title.trim() !== '') || 
                               (b.subtitle && b.subtitle.trim() !== '') || 
                               (b.btnText && b.btnText.trim() !== '');

            return `
            <div id="banner-slide-${index}" class="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive}">
                <div class="absolute inset-0 bg-slate-900">
                    <img src="${b.image}" class="absolute inset-0 w-full h-full object-cover object-center z-0">
                    
                    ${hasContent ? `<div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent z-10 pointer-events-none"></div>` : ''}
                </div>

                ${hasContent ? `
                <div class="absolute inset-0 w-full max-w-[1440px] mx-auto px-4 md:px-6 relative h-full">
                    <div id="banner-text-${index}" class="absolute inset-0 z-20 flex flex-col justify-center px-4 md:px-24 max-w-5xl transition-all duration-700 ease-out ${index === 0 ? 'translate-y-0' : 'translate-y-4'}">
                        <div class="text-center md:text-left">
                            <span class="inline-block py-1 px-3 rounded-full bg-[#00979D]/20 text-[#00979D] text-xs font-bold mb-4 border border-[#00979D]/30 uppercase tracking-widest">${b.badge || 'Destacado'}</span>
                            <h2 class="text-4xl md:text-6xl xl:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">${b.title || ''}</h2>
                            <p class="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl drop-shadow-md mx-auto md:mx-0">${b.subtitle || ''}</p>
                            
                            ${hasButton ? `
                            <div class="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button onclick="window.history.pushState({}, '', '${b.btnLink || '?page=shop'}'); router.handle(true);" class="bg-[#00979D] text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-[#09BFED] transition shadow-lg shadow-[#00979D]/20 flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95 group">${b.btnText} <i class="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i></button>
                            </div>` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>`;
        }
    }).join('');


// CÓDIGO ACTUALIZADO PARA FLECHAS CON RESPLANDOR ARDUINO
    const navButtonsHTML = banners.length > 1 ? `
        <button onclick="window.moveBanner(-1)" 
            class="absolute left-0 top-0 bottom-0 z-40 w-20 flex items-center justify-start pl-2 group/btn outline-none focus:outline-none 
                   transition-all duration-500 ease-out 
                   opacity-100 md:opacity-0 md:-translate-x-full md:group-hover/banner:opacity-100 md:group-hover/banner:translate-x-0">
            
            <div class="h-16 w-10 md:h-20 md:w-12 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 border-l-0 rounded-r-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 
                        group-hover/btn:bg-[#00979D] group-hover/btn:text-slate-900 group-hover/btn:w-14 
                        group-hover/btn:shadow-[0_0_30px_rgba(0,151,157,0.6)]"> <i class="ph-bold ph-caret-left text-2xl md:text-3xl transition-transform duration-300 group-hover/btn:-translate-x-1"></i>
            </div>
        </button>

        <button onclick="window.moveBanner(1)" 
            class="absolute right-0 top-0 bottom-0 z-40 w-20 flex items-center justify-end pr-2 group/btn outline-none focus:outline-none 
                   transition-all duration-500 ease-out 
                   opacity-100 md:opacity-0 md:translate-x-full md:group-hover/banner:opacity-100 md:group-hover/banner:translate-x-0">
            
            <div class="h-16 w-10 md:h-20 md:w-12 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 border-r-0 rounded-l-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-300 
                        group-hover/btn:bg-[#00979D] group-hover/btn:text-slate-900 group-hover/btn:w-14 
                        group-hover/btn:shadow-[0_0_30px_rgba(0,151,157,0.6)]"> <i class="ph-bold ph-caret-right text-2xl md:text-3xl transition-transform duration-300 group-hover/btn:translate-x-1"></i>
            </div>
        </button>
    ` : '';



// --- 1. BARRA DE BENEFICIOS (ESTILO SHOPIFY PREMIUM) ---
    const trustBarHTML = `
    <div class="w-full border-y border-slate-100 bg-white mb-12 relative z-20">
        <div class="max-w-[1440px] mx-auto">
            <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                
                <div class="group flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors duration-300 cursor-default">
                    <div class="mb-3 text-[#00979D] text-3xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                        <i class="ph-duotone ph-truck"></i>
                    </div>
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-1">Envíos Nacionales</h3>
                    <p class="text-[10px] font-medium text-slate-500">Rápido y seguro vía Olva/Shalom</p>
                </div>

                <div class="group flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors duration-300 cursor-default">
                    <div class="mb-3 text-[#00979D] text-3xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                        <i class="ph-duotone ph-shield-check"></i>
                    </div>
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-1">Garantía Asegurada</h3>
                    <p class="text-[10px] font-medium text-slate-500">12 Meses por defectos de fábrica</p>
                </div>

                <div class="group flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors duration-300 cursor-default">
                    <div class="mb-3 text-[#00979D] text-3xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                        <i class="ph-duotone ph-credit-card"></i>
                    </div>
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-1">Pagos Flexibles</h3>
                    <p class="text-[10px] font-medium text-slate-500">Yape, Plin y Transferencia</p>
                </div>

                <div class="group flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors duration-300 cursor-default">
                    <div class="mb-3 text-[#00979D] text-3xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300">
                        <i class="ph-duotone ph-whatsapp-logo"></i>
                    </div>
                    <h3 class="text-xs font-black text-slate-900 uppercase tracking-[0.15em] mb-1">Soporte Directo</h3>
                    <p class="text-[10px] font-medium text-slate-500">Te ayudamos con tu proyecto</p>
                </div>

            </div>
        </div>
    </div>`;


// --- 2. CATEGORÍAS VISUALES DINÁMICAS (TOP 3 CON MÁS PRODUCTOS) ---
    
    // A. Contar cuántos productos tiene cada categoría
    const catCounts = {};
    PRODUCTS.forEach(p => {
        if (p.category) {
            catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        }
    });

    // B. Ordenar categorías por cantidad y tomar las 3 mejores
    const topCategories = CATEGORIES.map(c => {
        // Buscamos un producto de esta categoría para robarle la foto de portada
        const representativeProduct = PRODUCTS.find(p => p.category === c.name);
        return {
            name: c.name,
            count: catCounts[c.name] || 0,
            // Si hay producto, usamos su foto. Si no, una imagen gris por defecto.
            image: representativeProduct ? representativeProduct.image : 'https://via.placeholder.com/500?text=TechPeru'
        };
    })
    .filter(c => c.count > 0) // Solo mostrar si tienen al menos 1 producto
    .sort((a, b) => b.count - a.count) // Ordenar de mayor a menor
    .slice(0, 3); // Quedarnos solo con las 3 primeras

    // C. Generar el HTML de las tarjetas
    const visualCategoriesHTML = `
    <div class="mb-16">
        <div class="flex justify-between items-end mb-6 px-2">
            <h2 class="text-2xl font-bold text-slate-900">Explora por Categoría</h2>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            ${topCategories.map(c => `
                <div onclick="router.navigate('/shop', {category: '${c.name}'})" class="cursor-pointer group relative h-40 md:h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                    <img src="${c.image}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div class="absolute bottom-4 left-4">
                        <span class="text-white font-bold text-lg md:text-xl block mb-1">${c.name}</span>
                        <span class="text-xs text-slate-300 group-hover:text-[#26E4ED] transition flex items-center gap-1">
                            ${c.count} productos <i class="ph-bold ph-arrow-right"></i>
                        </span>
                    </div>
                </div>
            `).join('')}

            <div onclick="router.navigate('/shop')" class="cursor-pointer group relative h-40 md:h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all bg-slate-900 flex items-center justify-center border border-slate-800">
                <div class="text-center p-6 relative z-10">
                    <div class="w-12 h-12 rounded-full bg-[#00979D] text-white flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,151,157,0.5)]">
                        <i class="ph-bold ph-squares-four"></i>
                    </div>
                    <span class="text-white font-bold text-lg block group-hover:text-[#26E4ED] transition">Ver Todo</span>
                    <span class="text-xs text-slate-400 mt-1">Explora el catálogo completo</span>
                </div>
                <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#00979D_1px,transparent_1px)] [background-size:16px_16px]"></div>
            </div>

        </div>
    </div>`;

    // --- 3. BANNER PROMOCIONAL (ROMPE-RITMO) ---
    const promoBannerHTML = `
    <div class="w-full my-16 rounded-3xl overflow-hidden relative h-[300px] md:h-[400px] flex items-center group shadow-2xl">
        <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1500" class="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105">
        <div class="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        
        <div class="relative z-10 px-8 md:px-16 max-w-2xl">
            <span class="bg-[#00979D] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg">Servicio Técnico</span>
            <h2 class="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">¿Tienes un proyecto en mente? <br><span class="text-slate-400">Nosotros lo armamos.</span></h2>
            <p class="text-slate-300 text-lg mb-8 font-medium">Asesoría, diseño de circuitos para tus prototipos.</p>
            <button onclick="router.navigate('/services')" class="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-[#00979D] hover:text-white transition-all shadow-xl flex items-center gap-2 group-btn">
                Cotizar Proyecto <i class="ph-bold ph-arrow-right group-btn-hover:translate-x-1 transition-transform"></i>
            </button>
        </div>
    </div>`;




// --- ESTRUCTURA FINAL DE LA PÁGINA DE INICIO ---
    container.innerHTML = `
    <div class="relative w-full h-[350px] sm:h-[450px] md:h-[600px] group/banner bg-slate-900 mb-12">
        ${carouselHTML}
        ${navButtonsHTML}
        ${banners.length > 1 ? `<div class="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex gap-3">${banners.map((_, idx) => `<button onclick="window.currentBannerIndex = ${idx}-1; window.moveBanner(1)" id="indicator-${idx}" class="h-1.5 rounded-full transition-all duration-300 hover:bg-[#00979D] shadow-sm ${idx === 0 ? 'bg-[#00979D] w-8' : 'bg-slate-500 w-4'}"></button>`).join('')}</div>` : ''}
    </div>

    ${trustBarHTML}

    <div class="w-full max-w-[1440px] mx-auto px-4 md:px-6">

        ${visualCategoriesHTML}

        <div class="flex justify-between items-end mb-6 px-2">
            <div>
                <h2 class="text-2xl md:text-3xl font-bold text-slate-900">Más Vistos</h2>
                <p class="text-slate-500 text-sm mt-1">Lo que todos están buscando hoy.</p>
            </div>
            <a href="#" onclick="event.preventDefault(); router.navigate('/shop')" class="text-blue-600 font-bold hover:text-blue-700 text-sm md:text-base flex items-center gap-1">Ver todo <i class="ph-bold ph-arrow-right"></i></a>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 pb-12">
            ${productsHTML}
        </div>

        ${promoBannerHTML}

        ${offerProducts.length > 0 ? `
        <div class="w-full py-12 mb-12 bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative group-offer">
            <div class="px-6 md:px-12 mb-8 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    
<div class="text-center max-w-3xl mx-auto py-10 mb-6 border-b border-slate-200">
    <div class="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-1.5 rounded-full mb-4">
        <i class="ph-fill ph-fire text-red-500 text-sm animate-bounce"></i>
        <span class="text-red-600 text-xs font-bold uppercase tracking-wider">No te lo pierdas!</span>
    </div>
    
    <h2 class="text-5xl font-black text-slate-900 mb-3 tracking-tighter">
        Ofertas <span class="italic text-[#00979D]">2MTP</span>
    </h2>
    
    <p class="text-slate-500 text-lg">
        Aprovecha los mejores descuentos.
    </p>
</div>
                
                <div class="flex items-center gap-3">
                    <button onclick="router.navigate('/shop', {filter: 'offers'})" class="hidden md:flex bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-bold hover:bg-slate-100 transition text-xs items-center gap-2 shadow-sm">
                        Ver todo <i class="ph-bold ph-arrow-right"></i>
                    </button>

                    <div class="flex gap-2">
                        <button onclick="document.getElementById('offers-scroll').scrollBy({left: -320, behavior: 'smooth'})" class="w-12 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-600 flex items-center justify-center transition-all shadow-sm">
                            <i class="ph-bold ph-caret-left text-xl"></i>
                        </button>
                        <button onclick="document.getElementById('offers-scroll').scrollBy({left: 320, behavior: 'smooth'})" class="w-12 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-600 flex items-center justify-center transition-all shadow-sm">
                            <i class="ph-bold ph-caret-right text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div id="offers-scroll" class="flex gap-6 overflow-x-auto no-scrollbar pb-8 scroll-smooth snap-x snap-mandatory px-6 md:px-12">
                ${offerProducts.map(p => `
                    <div class="min-w-[280px] w-[280px] snap-start">
                        ${ProductCard(p)}
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        ${newProducts.length > 0 ? `
        <div class="w-full py-10 mb-24 relative">
            <div class="flex justify-between items-end mb-8 px-2">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="bg-[#29AB30] text-white text-[10px] font-bold px-3 py-1 rounded uppercase tracking-widest border border-blue-500 shadow-sm">Recién Llegados</span>
                    </div>
                    <h2 class="text-3xl font-extrabold text-slate-900">Nuevos Ingresos</h2>
                    <p class="text-slate-500 mt-1">Lo último con etiqueta de novedad.</p>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="document.getElementById('new-products-scroll').scrollBy({left: -320, behavior: 'smooth'})" class="w-12 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-600 flex items-center justify-center transition-all shadow-sm">
                        <i class="ph-bold ph-caret-left text-xl"></i>
                    </button>
                    <button onclick="document.getElementById('new-products-scroll').scrollBy({left: 320, behavior: 'smooth'})" class="w-12 h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 text-slate-600 flex items-center justify-center transition-all shadow-sm">
                        <i class="ph-bold ph-caret-right text-xl"></i>
                    </button>
                </div>
            </div>

            <div id="new-products-scroll" class="flex gap-6 overflow-x-auto no-scrollbar pb-8 scroll-smooth snap-x snap-mandatory px-2">
                ${newProducts.map(p => `
                    <div class="min-w-[280px] w-[280px] snap-start">
                        ${ProductCard(p)}
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
 
    </div>`;

     // Iniciamos el efecto Scroll Pop Out
// Inicializamos el sistema híbrido
setTimeout(() => window.initBannerEffects(), 100);

        if(banners.length > 1) {
            window.bannerInterval = setInterval(() => window.moveBanner(1), 6000);
        }
    }

function renderShop(container, category, currentPage = 1, filterType = null, searchTerm = '') {

    // --- 1. LÓGICA DE FILTROS (Mantenemos tu lógica original intacta) ---
    let items = category ? PRODUCTS.filter(p => p.category === category) : PRODUCTS;
    if (filterType === 'offers') items = items.filter(p => p.isOffer === true);

    const rawTerm = searchTerm || document.getElementById('global-search')?.value || document.getElementById('mobile-search-input')?.value || "";
    const search = rawTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if(search) {
        items = items.filter(p => {
            const cleanName = (p.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cleanCat = (p.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return cleanName.includes(search) || cleanCat.includes(search);
        });
    }

// --- 2. ORDENAMIENTO ALEATORIO (MIX SORPRESA) ---
    
    // Si el cliente está BUSCANDO o filtrando OFERTAS, respetamos el orden lógico
    if (search || filterType === 'offers') {
        items.sort((a, b) => {
            // Prioridad a las ofertas si se buscan ofertas
            if (filterType === 'offers') {
                return (b.price - (b.offerPrice || 0)) - (a.price - (a.offerPrice || 0));
            }
            // Si es búsqueda, priorizamos coincidencia de nombre (opcional)
            return 0; 
        });
    } 
    // Si está NAVEGANDO (viendo el catálogo normal), ¡mezclamos todo!
    else {
        // Truco matemático para desordenar el array (Shuffle)
        items.sort(() => Math.random() - 0.5);
    }


// --- 3. LÓGICA DE PAGINACIÓN (20 Productos) ---
    const itemsPerPage = 20; // <--- AQUÍ ESTÁ EL LÍMITE DE 20
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Validaciones para que no de error si cambias de categoría
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    // --- GENERADOR DE BOTONES DE PAGINACIÓN (Diseño Moderno) ---
    let paginationHTML = '';
    
    if (totalPages > 1) {
        paginationHTML = `
        <div class="flex flex-col items-center justify-center mt-16 pb-8 fade-in">
            
            <div class="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-full shadow-lg shadow-slate-200/50">
                
                <button onclick="router.navigate('/shop', {category: '${category || ''}', pageNum: ${currentPage - 1}, search: '${search}'})" 
                        class="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${currentPage > 1 ? 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white' : 'text-slate-300 cursor-not-allowed'}" 
                        ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="ph-bold ph-caret-left text-lg"></i>
                </button>

                <div class="flex items-center gap-1 px-2 border-x border-slate-100">
        `;

        // Lógica inteligente para mostrar botones (Ej: 1, 2, 3 ... 10)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        // Siempre mostrar la página 1
        if (startPage > 1) {
            paginationHTML += `<button onclick="router.navigate('/shop', {category: '${category || ''}', pageNum: 1, search: '${search}'})" class="w-10 h-10 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50 transition">1</button>`;
            if (startPage > 2) paginationHTML += `<span class="text-slate-300 text-xs px-1">...</span>`;
        }

        // El bucle de las páginas centrales
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPage;
            paginationHTML += `
            <button onclick="router.navigate('/shop', {category: '${category || ''}', pageNum: ${i}, search: '${search}'})" 
                    class="w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 flex items-center justify-center
                    ${isActive 
                        ? 'bg-[#00979D] text-white shadow-md shadow-[#00979D]/30 scale-110' 
                        : 'bg-transparent text-slate-600 hover:bg-slate-100'}">
                ${i}
            </button>`;
        }

        // Siempre mostrar la última página
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) paginationHTML += `<span class="text-slate-300 text-xs px-1">...</span>`;
            paginationHTML += `<button onclick="router.navigate('/shop', {category: '${category || ''}', pageNum: ${totalPages}, search: '${search}'})" class="w-10 h-10 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50 transition">${totalPages}</button>`;
        }

        paginationHTML += `
                </div>

                <button onclick="router.navigate('/shop', {category: '${category || ''}', pageNum: ${currentPage + 1}, search: '${search}'})" 
                        class="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${currentPage < totalPages ? 'bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white' : 'text-slate-300 cursor-not-allowed'}" 
                        ${currentPage === totalPages ? 'disabled' : ''}>
                    <i class="ph-bold ph-caret-right text-lg"></i>
                </button>

            </div>

            <span class="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
                Mostrando página ${currentPage} de ${totalPages}
            </span>

        </div>`;
    }









    // --- 4. NUEVO DISEÑO DE SIDEBAR (PROFESIONAL) ---
    
    // Calculamos el total global para el botón "Todas"
    const totalProductsCount = PRODUCTS.length;

    const catListDesktop = CATEGORIES.map(c => {
        const isSelected = category === c.name;
        const isPinned = c.isPinned;
        
        // CALCULAR CANTIDAD (Toque Profesional)
        const qty = PRODUCTS.filter(p => p.category === c.name).length;

        // ESTILOS DINÁMICOS
        // Activo: Cápsula oscura (Slate-900) con texto blanco.
        // Inactivo: Texto gris, hover blanco con sombra sutil.
        const btnClass = isSelected 
            ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 transform scale-[1.02]" 
            : "text-slate-500 hover:bg-white hover:text-[#00979D] hover:shadow-sm hover:pl-5";

        const badgeClass = isSelected
            ? "bg-[#00979D] text-white"
            : "bg-slate-200 text-slate-400 group-hover:bg-[#00979D]/10 group-hover:text-[#00979D]";

        // Icono de estrella dorada si está fijado
        const iconHTML = isPinned 
            ? `<i class="ph-fill ph-star text-amber-400 text-xs mr-2 animate-pulse"></i>` 
            : ``;

        return `
        <button onclick="router.navigate('/shop', {category: '${c.name}', pageNum: 1})" 
                class="group w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 mb-2 border border-transparent ${btnClass}">
            
            <div class="flex items-center font-bold text-sm tracking-tight">
                ${iconHTML}
                <span>${c.name}</span>
            </div>
            
            <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-colors duration-300 ${badgeClass}">
                ${qty}
            </span>
        </button>`;
    }).join('');

    // Diseño Móvil (Chips horizontales)
    const catListMobile = CATEGORIES.map(c => {
        const isSelected = category === c.name;
        return `
        <button onclick="router.navigate('/shop', {category: '${c.name}', pageNum: 1})" 
            class="whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition flex-shrink-0 border 
            ${isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}">
            ${c.name}
        </button>`;
    }).join('');






    // --- 6. RENDERIZADO FINAL (AQUÍ ESTÁ EL CAMBIO VISUAL) ---
    container.innerHTML = `
    <div class="w-full max-w-[1440px] mx-auto px-4 md:px-6 min-h-screen">
        












<div class="relative w-full mb-10 overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-sm mt-4 group">
            
            <div class="absolute inset-0 bg-white z-0"></div>

            <div class="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent skew-x-12 z-0 opacity-80"></div>
            
            <div class="absolute right-[-20px] md:right-10 top-1/2 -translate-y-1/2 w-48 md:w-80 opacity-[0.06] pointer-events-none transform -rotate-12 z-0 mix-blend-multiply transition-transform duration-700 group-hover:scale-110 group-hover:rotate-0">
                <img src="https://qeoojbsrqlroajvdgrju.supabase.co/storage/v1/object/public/productos/2MTECHPERU%20logo.png" 
                     alt="Marca de Agua TechPerú" 
                     class="w-full h-auto object-contain">
            </div>

            <div class="absolute top-0 right-20 w-32 h-2 bg-[#00979D] rounded-b-lg opacity-20 z-0"></div>

            <div class="relative z-10 px-8 py-12 md:px-16 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div class="max-w-3xl text-center md:text-left">
                    
                    <div class="inline-flex items-center gap-2 mb-4">
                        <span class="w-6 h-[2px] bg-[#00979D]"></span>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                            ${category ? 'Categoría Seleccionada' : 'Catálogo Completo'}
                        </span>
                    </div>

<h1 class="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
    ${category ? category : (filterType === 'offers'
        ? 'Ofertas <span class="text-[#0ae4da]" style="-webkit-text-stroke: 1px #141b2d;">Especiales</span>'
        : '<span class="text-[#10c4c1]" style="-webkit-text-stroke: 2px #141b2d;">2M</span> <span class="text-[#0ae4da]" style="-webkit-text-stroke: 2px #141b2d;">Tech</span><span class="text-white" style="-webkit-text-stroke: 2px #141b2d;">Perú</span>'
    )}
</h1>



                    

                    <p class="text-lg text-slate-500 font-medium max-w-xl mx-auto md:mx-0">
                        ${category 
                            ? `Explora los mejores productos en <b>${category}</b>.` 
                            : 'Componentes electrónicos de alta gama, sensores y módulos para tus proyectos.'}
                    </p>
                </div>

                <div class="hidden md:flex items-center justify-center relative z-10">
                    <div class="w-20 h-20 rounded-full border-[4px] border-white shadow-lg flex items-center justify-center bg-slate-50 group-hover:bg-white transition-colors">
                         <div class="w-12 h-12 rounded-full bg-slate-100 text-[#00979D] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                            <i class="ph-bold ph-arrow-down-right"></i>
                         </div>
                    </div>
                </div>

            </div>
        </div>


        



<style>
            #main-header { position: relative !important; transform: none !important; top: auto !important; }
            #mobile-search-bar { display: none !important; } /* Opcional: limpia la vista móvil */
        </style>

        <div class="flex flex-col gap-8 mb-12">
            
            <div class="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all" id="category-sticky-bar">
                
                <div class="relative w-full max-w-[1440px] mx-auto px-4 md:px-0 group/cat-nav">
                    
                    <button onclick="document.getElementById('cat-scroll-container').scrollBy({left: -200, behavior: 'smooth'})" 
                            class="absolute left-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-r from-white via-white/90 to-transparent flex items-center justify-start pl-4 text-slate-400 hover:text-[#00979D] transition-colors md:opacity-0 md:group-hover/cat-nav:opacity-100">
                        <i class="ph-bold ph-caret-left text-2xl"></i>
                    </button>

                    <div id="cat-scroll-container" class="flex items-center gap-3 overflow-x-auto no-scrollbar py-4 px-2 scroll-smooth">
                        
                        <button onclick="router.navigate('/shop', {pageNum: 1})" 
                                class="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-sm border select-none
                                ${!category ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/20 scale-105 ring-2 ring-offset-2 ring-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:border-[#00979D] hover:text-[#00979D]'}">
                            <i class="ph-bold ph-squares-four"></i>
                            <span>Todo</span>
                            <span class="ml-1 opacity-60 text-xs bg-white/20 px-1.5 rounded-full">${totalProductsCount}</span>
                        </button>

                        <div class="w-px h-6 bg-slate-200 mx-1 flex-shrink-0"></div>

                        ${CATEGORIES.map(c => {
                            const isSelected = category === c.name;
                            const qty = PRODUCTS.filter(p => p.category === c.name).length;
                            return `
                            <button onclick="router.navigate('/shop', {category: '${c.name}', pageNum: 1})" 
                                    class="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border group whitespace-nowrap select-none
                                    ${isSelected 
                                        ? 'bg-[#00979D] text-white border-[#00979D] shadow-lg shadow-[#00979D]/30 scale-105' 
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-[#00979D] hover:text-[#00979D] hover:shadow-md'}">
                                
                                <span>${c.name}</span>
                                ${isSelected 
                                    ? `<i class="ph-bold ph-check bg-white/20 rounded-full p-0.5 text-xs"></i>` 
                                    : `<span class="bg-slate-100 text-slate-400 text-[10px] px-1.5 py-0.5 rounded-full group-hover:bg-[#00979D]/10 group-hover:text-[#00979D] transition-colors">${qty}</span>`}
                            </button>`;
                        }).join('')}
                        
                        <div class="w-12 flex-shrink-0"></div>
                    </div>

                    <button onclick="document.getElementById('cat-scroll-container').scrollBy({left: 200, behavior: 'smooth'})" 
                            class="absolute right-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-l from-white via-white/90 to-transparent flex items-center justify-end pr-4 text-slate-400 hover:text-[#00979D] transition-colors md:opacity-0 md:group-hover/cat-nav:opacity-100">
                        <i class="ph-bold ph-caret-right text-2xl"></i>
                    </button>

                </div>
            </div>

            <div class="w-full min-h-[500px]">
                
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 gap-y-10">
                    ${paginatedItems.length ? paginatedItems.map(p => `
                        <div class="reveal-on-scroll h-full">
                            ${ProductCard(p)}
                        </div>
                    `).join('') : `
                        <div class="col-span-full flex flex-col items-center justify-center py-32 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <i class="ph-duotone ph-magnifying-glass text-4xl text-slate-300"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-900 mb-1">No encontramos productos</h3>
                            <p class="text-slate-500 text-sm max-w-xs mx-auto">Intenta seleccionar otra categoría o cambiar tu búsqueda.</p>
                            <button onclick="router.navigate('/shop')" class="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-[#00979D] transition shadow-lg">
                                Ver todo el catálogo
                            </button>
                        </div>
                    `}
                </div>
                
                ${paginationHTML}
            </div>
        </div>

    </div>`;

    // Reactivar animaciones de scroll
    setTimeout(() => window.initScrollAnimations(), 100); 
}





async function renderProduct(container, slug) {

    // Pantalla de carga (Igual que antes)
    container.innerHTML = `
    <div class="w-full min-h-[80vh] flex flex-col items-center justify-center bg-white fade-in">
        <div class="animate-pulse flex flex-col items-center">
            <i class="ph-fill ph-circuitry text-[#00979D] text-6xl mb-4"></i>
            <h1 class="text-4xl font-extrabold text-slate-900 tracking-tighter">Tech<span class="text-[#00979D]">Perú</span></h1>
            <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Cargando...</p>
        </div>
    </div>`;
    
    const p = PRODUCTS.find(x => x.slug === slug);

    // --- CÓDIGO NUEVO: CONTADOR DE VISTAS SEGURO ---
    if (p && p.id) {
        // Creamos una llave única para esta sesión y producto
        const viewedKey = `viewed_product_${p.id}`;
        
        // Verificamos: ¿Ya visitó este producto en esta sesión?
        if (!sessionStorage.getItem(viewedKey)) {
            
            // Si NO lo ha visitado, marcamos que ya lo vio para que no se repita
            sessionStorage.setItem(viewedKey, 'true');

            // Usamos una transacción segura para sumar +1 en la base de datos
            const productRef = ref(db, `products/${p.id}/views`);
            window.firebaseModules.runTransaction(productRef, (currentViews) => {
                return (currentViews || 0) + 1;
            }).then(() => {
                console.log("Vista sumada correctamente");
            }).catch((err) => {
                console.error("Error al sumar vista (ignorable):", err);
            });
        }
    }
    // --------------------------------------------------
// --- PEGAR ESTO JUSTO DESPUÉS DE ENCONTRAR 'p' ---
    let restockMsg = null;
    
    if (p.stock <= 0 && p.restockDate) {
        const today = new Date();
        today.setHours(0,0,0,0); 
        
        // Corregir la fecha para evitar problemas de zona horaria
        const parts = p.restockDate.split('-');
        const target = new Date(parts[0], parts[1] - 1, parts[2]); 
        
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 0) {
            restockMsg = `Llega en ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        } else if (diffDays === 0) {
            restockMsg = "¡Llega Hoy!";
        }
    }
    // -----------------------------------------------------

    if(!p) return container.innerHTML = "<div class='flex items-center justify-center h-96'><div class='text-center'><i class='ph ph-spinner animate-spin text-4xl mb-4'></i><p>Cargando o Producto no encontrado...</p></div></div>";
    
    // 1. Lógica de Productos Similares
    const similarProducts = PRODUCTS.filter(item => item.category === p.category && item.id !== p.id);
    const loopSimilar = similarProducts.length > 0 ? [...similarProducts, ...similarProducts, ...similarProducts, ...similarProducts] : [];
    const displaySimilar = loopSimilar.slice(0, 20);

    let similarHTML = '';
    if(similarProducts.length > 0) {
        similarHTML = `<div class="mt-16 border-t border-slate-200 pt-12"><div class="mb-8 px-2"><h3 class="text-2xl font-bold text-slate-900 mb-1">Productos Similares</h3><p class="text-slate-500 text-sm">Quienes vieron esto también compraron</p></div><div class="relative w-full overflow-hidden py-4"><div class="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#f8fafc] to-transparent z-20 pointer-events-none"></div><div class="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#f8fafc] to-transparent z-20 pointer-events-none"></div><div class="animate-infinite-scroll flex gap-6 px-4">${displaySimilar.map(sim => `<div class="w-[280px] md:w-[300px] flex-shrink-0 transform transition hover:scale-105 duration-300 overflow-hidden">${ProductCard(sim)}</div>`).join('')}</div></div></div>`;
    }

    // 2. Datos Básicos
    const rating = p.rating ? parseFloat(p.rating).toFixed(1) : "0.0";
    const reviewsCount = p.reviewCount || 0;
    const stock = p.stock || 0;
    const isStock = stock > 0;
    const isFav = state.favorites.has(p.id);

    // 3. Lógica de Imágenes
    window.currentProdImages = [p.image, ...(p.gallery || [])];
    window.currentProdIdx = 0;
    
    window.moveProdImg = (step) => {
        if(window.currentProdImages.length <= 1) return;
        let newIdx = window.currentProdIdx + step;
        if(newIdx >= window.currentProdImages.length) newIdx = 0;
        if(newIdx < 0) newIdx = window.currentProdImages.length - 1;
        
        window.currentProdIdx = newIdx;
        const mainImg = document.getElementById('main-product-img');
        // Actualizamos imagen y agregamos efecto fade
        mainImg.src = window.currentProdImages[newIdx];
        mainImg.classList.remove('fade-in');
        void mainImg.offsetWidth; // Trigger reflow
        mainImg.classList.add('fade-in');
    };

    let videoBtn = '';
    if (p.hasVideo && p.videoUrl) {
        videoBtn = `<button onclick="openVideoModal('${p.videoUrl}')" class="group mt-4 mx-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold shadow-sm flex items-center justify-center gap-3 transition-colors duration-300 border border-slate-800">
            <div class="relative w-5 h-5 overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-full"><i class="ph-fill ph-youtube-logo text-lg text-red-500"></i></div>
                <div class="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out translate-y-full group-hover:translate-y-0"><i class="ph-fill ph-play text-lg text-white"></i></div>
            </div>
            <span class="text-[10px] tracking-[0.2em] uppercase pt-0.5">Ver Review</span>
        </button>`;
    }

    const thumbnailsHTML = window.currentProdImages.length > 1 ? `
        <div class="flex gap-2 mt-4 overflow-x-auto pb-2 px-1 no-scrollbar justify-center">
            ${window.currentProdImages.map((img, idx) => `
                <button onclick="window.currentProdIdx = ${idx}; document.getElementById('main-product-img').src = '${img}'" 
                class="group w-14 h-14 flex-shrink-0 rounded-lg border border-slate-200 bg-white p-1 hover:border-slate-900 transition shadow-sm overflow-hidden relative">
                    <img src="${img}" class="w-full h-full object-contain group-hover:scale-110 transition-transform">
                </button>
            `).join('')}
        </div>` : '';

    const starsHTML = Array(5).fill(0).map((_, i) => i < Math.round(rating) ? '<i class="ph-fill ph-star text-[#00979D]"></i>' : '<i class="ph-bold ph-star text-slate-300"></i>').join('');

    // 4. Cargar Reseñas
    let reviewsListHTML = '<div class="py-8 text-center text-slate-400">Cargando opiniones...</div>';
    try {
        const snap = await get(ref(db, `reviews/${p.id}`));
        if(snap.exists()) {
            const revs = Object.values(snap.val()).reverse();
            reviewsListHTML = revs.map(r => `
                <div class="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100 text-left">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">${r.userName.charAt(0).toUpperCase()}</div>
                            <span class="font-bold text-sm text-slate-900">${r.userName}</span>
                        </div>
                        <span class="text-xs text-slate-400">${new Date(r.date).toLocaleDateString()}</span>
                    </div>
                    <div class="flex text-[#00979D] text-xs mb-2">
                        ${Array(5).fill(0).map((_, i) => i < r.rating ? '<i class="ph-fill ph-star"></i>' : '<i class="ph-bold ph-star text-slate-300"></i>').join('')}
                    </div>
                    <p class="text-slate-600 text-sm mb-2">"${r.comment}"</p>
                    ${r.reply ? `<div class="mt-3 ml-4 pl-3 border-l-2 border-[#00979D] bg-white p-2 rounded-r-lg shadow-sm"><div class="flex items-center gap-1 mb-1"><i class="ph-fill ph-arrow-bend-down-right text-[#26E4ED] text-sm"></i><span class="text-xs font-extrabold text-slate-900">Respuesta de TechPerú</span></div><p class="text-xs text-slate-500 leading-relaxed">${r.reply}</p></div>` : ''}
                </div>`).join('');
        } else { reviewsListHTML = '<div class="py-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Aún no hay reseñas. ¡Sé el primero!</div>'; }
    } catch(e) { console.error(e); }

    let specsHTML = '<p class="text-slate-500 italic">No hay especificaciones detalladas.</p>';
    if (p.specifications) {
        const lines = p.specifications.split('\n').filter(line => line.trim() !== '');
        specsHTML = `<ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">${lines.map(line => `<li class="flex items-start gap-3 py-2 border-b border-slate-100 text-sm text-slate-700"><i class="ph-fill ph-check-circle text-green-500 mt-0.5"></i><span>${line}</span></li>`).join('')}</ul>`;
    }

    let reviewFormHTML = '';
    if (!state.user) {
        reviewFormHTML = `<div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8 text-center"><p class="text-blue-800 font-medium mb-3">Inicia sesión para compartir tu opinión</p><button onclick="router.navigate('/login')" class="bg-white text-slate-900 text-sm font-bold px-6 py-2 rounded-full border border-slate-200 hover:bg-slate-50">Ir al Login</button></div>`;
    } else {
        const hasPurchased = state.orders.some(order => order.status === 'Aprobado' && order.items && order.items.some(item => item.id === p.id));
        if (hasPurchased) {
            reviewFormHTML = `
            <div class="bg-white p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
                <h4 class="font-bold text-slate-900 mb-4">Escribe tu opinión</h4>
                <div class="flex gap-2 mb-4 text-2xl cursor-pointer" id="star-selector"><i onclick="reviewManager.setRating(1)" id="star-form-1" class="ph-bold ph-star text-slate-300 hover:text-[#00979D] transition"></i><i onclick="reviewManager.setRating(2)" id="star-form-2" class="ph-bold ph-star text-slate-300 hover:text-[#00979D] transition"></i><i onclick="reviewManager.setRating(3)" id="star-form-3" class="ph-bold ph-star text-slate-300 hover:text-[#00979D] transition"></i><i onclick="reviewManager.setRating(4)" id="star-form-4" class="ph-bold ph-star text-slate-300 hover:text-[#00979D] transition"></i><i onclick="reviewManager.setRating(5)" id="star-form-5" class="ph-bold ph-star text-slate-300 hover:text-[#00979D] transition"></i></div>
                <textarea id="review-comment" class="w-full p-3 rounded-xl border border-slate-200 mb-4 focus:border-[#00979D] outline-none text-sm bg-slate-50" rows="3" placeholder="¿Qué te pareció el producto?"></textarea>
                <button onclick="reviewManager.submitReview('${p.id}')" class="bg-slate-900 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-slate-800 transition">Publicar Reseña</button>
            </div>`;
        } else {
            reviewFormHTML = `<div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 text-center opacity-75"><i class="ph-bold ph-lock-key text-2xl text-slate-400 mb-2"></i><p class="text-slate-600 text-sm font-medium">Solo los clientes que han comprado y validado este producto pueden dejar una reseña.</p></div>`;
        }
    }

    // 5. PREPARAR VARIABLES DE VARIANTES (Colores / Resistencias)
    
    // A. COLORES
    let colorHTML = '';
    if (p.hasColors && p.colors && p.colors.length > 0) {
        window.selectedColorData = null; 
        window.currentMaxStock = 0; 
        const circles = p.colors.map((c, index) => {
            const sinStock = c.qty <= 0;
            return `
            <div onclick="${sinStock ? '' : `selectProductColor(${index}, '${p.id}')`}" 
                 class="cursor-pointer group relative flex flex-col items-center gap-1 ${sinStock ? 'opacity-30 grayscale cursor-not-allowed' : ''}">
                <div id="color-btn-${index}" class="color-circle-option w-10 h-10 rounded-full border border-slate-200 shadow-sm flex items-center justify-center transition-all hover:scale-105" style="background-color: ${c.hex};">
                    <i class="ph-bold ph-check text-white drop-shadow-md hidden check-icon"></i>
                </div>
                <span class="text-[10px] font-bold text-slate-500 truncate max-w-[60px]">${c.name}</span>
                ${sinStock ? '<span class="text-[9px] text-red-500 font-bold absolute -top-2 bg-white px-1 rounded border border-red-100">Agotado</span>' : ''}
            </div>`;
        }).join('');

        colorHTML = `
        <div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div class="flex justify-between items-center mb-3">
                <label class="text-xs font-bold text-slate-500 uppercase tracking-wider">Elige un Color:</label>
                <div id="dynamic-stock-label" class="text-xs text-slate-400">Selecciona para ver stock</div>
            </div>
            <div class="flex flex-wrap gap-4">
                ${circles}
            </div>
            <div id="color-warning-msg" class="hidden mt-3 text-red-500 text-xs font-bold flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-100">
                <i class="ph-bold ph-warning-circle text-lg"></i> ¡Debes seleccionar un color primero!
            </div>
        </div>`;
    }

    // B. RESISTENCIAS
    let resistanceHTML = '';
    if (p.hasResistances && p.resistances && p.resistances.length > 0) {
        window.selectedResistanceData = null;
        window.currentMaxStock = 0;

        const optionsHTML = p.resistances.map((r, index) => {
            const sinStock = r.qty <= 0;
            return `<option value="${index}" ${sinStock ? 'disabled' : ''}>
                        ${r.value} ${sinStock ? '(Agotado)' : ''}
                    </option>`;
        }).join('');

        resistanceHTML = `
        <div class="mb-8 pt-6 border-t border-slate-100">
            <div class="flex justify-between items-end mb-3 px-1">
                <span class="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <i class="ph-fill ph-sliders-horizontal text-[#26E4ED]"></i> Especificación
                </span>
                <div id="dynamic-stock-label" class="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    Selecciona una opción
                </div>
            </div>
            
            <div class="relative group w-full">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <i class="ph-bold ph-lightning text-slate-400 group-hover:text-[#26E4ED] transition-colors duration-300 text-lg"></i>
                </div>

                <select onchange="handleResistanceChange(this, '${p.id}')" 
                        class="appearance-none w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-4 pl-12 pr-10 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-[#00979D] focus:ring-4 focus:ring-[#00979D]/10 transition-all duration-300 cursor-pointer shadow-sm hover:border-slate-300 hover:shadow-md">
                    <option value="" selected disabled>Seleccionar: </option>
                    ${optionsHTML}
                </select>
                
                <div class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-hover:text-slate-900 transition-colors duration-300">
                    <i class="ph-bold ph-caret-down text-base bg-slate-200 rounded-full p-1"></i>
                </div>
            </div>

            <div id="variant-warning-msg" class="hidden mt-3 ml-1 text-red-500 text-[11px] font-bold flex items-center gap-2 animate-pulse">
                <i class="ph-fill ph-warning-octagon"></i> Requerido: Selecciona un valor para continuar.
            </div>
        </div>`;
    }
    
// HTML DEL MODAL (CON FLECHAS AGREGADAS)
    const modalZoomHTML = `
    <div id="product-zoom-modal" class="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md hidden opacity-0 transition-opacity duration-300 flex items-center justify-center">
        
        <button onclick="imageModalManager.close()" class="absolute top-4 right-4 z-[60] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition">
            <i class="ph-bold ph-x text-3xl"></i>
        </button>

        ${window.currentProdImages.length > 1 ? `
        <button onclick="imageModalManager.prev()" class="absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/10 hover:border-white/30">
            <i class="ph-bold ph-caret-left text-3xl"></i>
        </button>
        ` : ''}

        ${window.currentProdImages.length > 1 ? `
        <button onclick="imageModalManager.next()" class="absolute right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/10 hover:border-white/30">
            <i class="ph-bold ph-caret-right text-3xl"></i>
        </button>
        ` : ''}

        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-slate-800/80 backdrop-blur px-6 py-3 rounded-full border border-slate-700 shadow-2xl">
            <button onclick="imageModalManager.zoomOut()" class="text-white hover:text-[#00979D] transition" title="Alejar"><i class="ph-bold ph-minus"></i></button>
            <div class="w-px h-4 bg-slate-600"></div>
            <button onclick="imageModalManager.reset()" class="text-white hover:text-[#00979D] transition text-xs font-bold uppercase tracking-wider" title="Restablecer">Reset</button>
            <div class="w-px h-4 bg-slate-600"></div>
            <button onclick="imageModalManager.zoomIn()" class="text-white hover:text-[#00979D] transition" title="Acercar"><i class="ph-bold ph-plus"></i></button>
        </div>

<div id="zoom-pan-container" class="w-full h-full flex items-center justify-center overflow-hidden cursor-move p-4">
    <img id="zoom-modal-img" src="" class="max-w-full max-h-[90vh] object-contain select-none origin-center transition-opacity duration-200">
</div>

        <p class="absolute top-4 left-4 text-slate-500 text-xs font-bold uppercase tracking-widest pointer-events-none">
            <i class="ph-fill ph-mouse-scroll"></i> Usa la rueda para Zoom · Arrastra para mover
        </p>
    </div>`;

    // 6. CONSTRUCCIÓN DEL HTML PRINCIPAL
    container.innerHTML = `
        <div class="w-full max-w-[1400px] mx-auto px-4 pt-4 pb-12">
            <button onclick="window.history.back()" class="mb-8 flex items-center text-slate-500 hover:text-slate-900 font-medium transition"><i class="ph-bold ph-arrow-left mr-2"></i> Volver a la tienda</button>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">

                <div class="lg:col-span-7">
                    <div class="relative group/main-img">
                        <div class="rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100 shadow-md min-h-[300px] max-h-[400px] relative bg-white cursor-zoom-in hover:border-slate-300 transition-colors"
                             onclick="imageModalManager.open(document.getElementById('main-product-img').src)">
                            
                            <img id="main-product-img" src="${p.image}" class="w-full h-full object-contain drop-shadow-xl max-h-[350px] fade-in transition-transform duration-500 group-hover/main-img:scale-105 ${!isStock ? 'grayscale opacity-50' : ''}">
                            
                            <div class="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-slate-900 p-3 rounded-xl shadow-lg border border-slate-100 opacity-0 translate-y-2 group-hover/main-img:opacity-100 group-hover/main-img:translate-y-0 transition-all duration-300 pointer-events-none">
                                <i class="ph-bold ph-magnifying-glass-plus text-xl"></i>
                            </div>

                            <div class="absolute top-3 right-3 pointer-events-auto z-20" onclick="event.stopPropagation()">
                                <button onclick="userActions.toggleFavorite('${p.id}')" class="p-2.5 rounded-full border transition-all shadow-sm ${isFav ? "bg-red-50 text-red-500 border-red-200" : "bg-white text-slate-400 border-slate-200 hover:border-red-200 hover:text-red-500"}">
                                    <i class="${isFav ? 'ph-fill' : 'ph-bold'} ph-heart text-xl"></i>
                                </button>
                            </div>

${!isStock ? `
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        ${restockMsg ? 
            `<div class="text-center transform -rotate-6 bg-white/90 p-3 rounded-2xl shadow-2xl border border-orange-200 backdrop-blur-sm">
                <span class="block bg-orange-500 text-white text-lg font-black px-4 py-1 rounded-lg uppercase tracking-widest shadow-md mb-1">
                    AGOTADO
                </span>
                <span class="block text-xs font-bold text-orange-800 uppercase tracking-wider">
                    ${restockMsg}
                </span>
             </div>`
            : 
            `<span class="bg-slate-900 text-white text-lg font-bold px-4 py-2 rounded-full shadow-2xl transform -rotate-12">AGOTADO</span>`
        }
    </div>
` : ''}

                        </div>
                    </div>
                    ${videoBtn}
                    ${thumbnailsHTML}
                </div>

                <div class="lg:col-span-5 flex flex-col">
                    <div class="mb-4 flex items-center gap-3">
                        <span class="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">${p.category}</span>
                        <span class="text-xs font-bold ${isStock ? 'text-green-600' : 'text-red-500'} flex items-center gap-1"><i class="ph-fill ${isStock ? 'ph-check-circle' : 'ph-x-circle'}"></i> ${isStock ? `Stock: ${stock}` : 'Agotado'}</span>
                    </div>
                    <h1 class="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">${p.name}</h1>
                    <div class="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                        <div class="flex flex-col">
                            ${p.isOffer && p.offerPrice ? `<span class="text-sm text-slate-400 line-through mb-1">Antes: S/ ${p.price.toFixed(2)}</span>` : ''}
                            <span class="text-4xl font-bold ${p.isOffer ? 'text-red-600' : 'text-slate-900'} tracking-tight">S/ ${(p.isOffer && p.offerPrice ? p.offerPrice : p.price).toFixed(2)}</span>
${p.points ? `<span class="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-200 select-none"><i class="ph-fill ph-star text-amber-500 text-sm"></i> Ganas +${p.points} Puntos</span>` : ''}
                       
                            </div>
                        <div class="h-12 w-px bg-slate-200"></div>
                        <div class="flex flex-col cursor-pointer" onclick="document.getElementById('tab-btn-reviews').click()">
                            <div class="flex text-xl mb-1">${starsHTML}</div>
                            <span class="text-xs text-slate-500 font-bold hover:text-blue-600 transition underline">${rating} (${reviewsCount} Opiniones)</span>
                        </div>
                    </div>

                    ${colorHTML}
                    ${resistanceHTML}

                    <div class="flex flex-col sm:flex-row gap-4 mb-8 items-end">
                        ${isStock ? `
                        <div class="w-full sm:w-auto">
                            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Cantidad</label>
                            <div class="flex items-center justify-between bg-white rounded-xl px-2 py-1 w-full sm:w-36 border-2 border-slate-100 hover:border-slate-300 transition h-[56px]">
                                <button onclick="detailQtyManager.update(-1, ${stock})" class="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition"><i class="ph-bold ph-minus"></i></button>
                                <input id="detail-qty-input" type="number" value="1" onchange="detailQtyManager.handleInput(this, ${stock})" class="w-full text-center font-extrabold text-xl text-slate-900 outline-none bg-transparent appearance-none">
                                <button onclick="detailQtyManager.update(1, ${stock})" class="w-10 h-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition"><i class="ph-bold ph-plus"></i></button>
                            </div>
                        </div>` : ''}

                        <button onclick="${isStock ? `cartManager.add('${p.id}', parseInt(document.getElementById('detail-qty-input').value))` : ''}" class="flex-1 font-bold h-[56px] px-8 rounded-xl shadow-xl flex items-center justify-center gap-3 transition transform active:scale-95 mt-[18px] ${isStock ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-400 cursor-not-allowed"}" ${!isStock ? 'disabled' : ''}>
                            <i class="ph-bold ph-shopping-cart text-xl"></i> ${isStock ? 'Añadir al Carrito' : (restockMsg ? `Disponible: ${restockMsg}` : 'Sin Stock')}
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"><i class="ph-fill ph-truck text-2xl text-slate-400"></i><div class="text-xs font-bold text-slate-600">Envío Rápido<br><span class="font-normal text-slate-400">A nivel nacional</span></div></div>
                        <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100"><i class="ph-fill ph-shield-check text-2xl text-slate-400"></i><div class="text-xs font-bold text-slate-600">Garantía<br><span class="font-normal text-slate-400">12 meses oficial</span></div></div>
                    </div>
                </div>
            </div>
            <div class="max-w-5xl mx-auto">
                <div class="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                    <button onclick="switchTab('desc')" id="tab-btn-desc" class="px-6 py-4 text-sm font-bold border-b-2 border-slate-900 text-slate-900 transition whitespace-nowrap">Descripción</button>
                    <button onclick="switchTab('specs')" id="tab-btn-specs" class="px-6 py-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition whitespace-nowrap">Especificaciones</button>
                    <button onclick="switchTab('reviews')" id="tab-btn-reviews" class="px-6 py-4 text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-700 transition whitespace-nowrap">Opiniones (${reviewsCount})</button>
                </div>
                <div id="content-desc" class="tab-content fade-in"><h3 class="text-xl font-bold text-slate-900 mb-4">Detalles del Producto</h3><p class="text-lg text-slate-600 leading-relaxed whitespace-pre-line">${p.description}</p></div>
                <div id="content-specs" class="tab-content hidden fade-in"><h3 class="text-xl font-bold text-slate-900 mb-6">Especificaciones Técnicas</h3><div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">${specsHTML}</div></div>
                <div id="content-reviews" class="tab-content hidden fade-in"><div class="max-w-3xl"><h3 class="text-xl font-bold text-slate-900 mb-6">Lo que dicen nuestros clientes</h3>${reviewFormHTML}<div class="space-y-2 mt-6">${reviewsListHTML}</div></div></div>
            </div>
            ${similarHTML}
        </div>
        ${modalZoomHTML}`;

    window.switchTab = (tab) => {
        ['desc', 'specs', 'reviews'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const content = document.getElementById(`content-${t}`);
            if(t === tab) { btn.classList.remove('border-transparent', 'text-slate-500'); btn.classList.add('border-slate-900', 'text-slate-900'); content.classList.remove('hidden'); } 
            else { btn.classList.add('border-transparent', 'text-slate-500'); btn.classList.remove('border-slate-900', 'text-slate-900'); content.classList.add('hidden'); }
        });
    };
}


function renderProfile(container, tab = 'summary') {
            const u = state.user;
            const userName = u.displayName || 'Usuario';
            const userEmail = u.email;
            const userInitial = userName.charAt(0).toUpperCase();
            const favProducts = PRODUCTS.filter(p => state.favorites.has(p.id));

            let contentHTML = '';
            
            // --- PESTAÑA RESUMEN ---
            if (tab === 'summary') {
                const progress = Math.min((state.points / 100) * 100, 100);
                contentHTML = `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="bg-white text-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden col-span-1 lg:col-span-2">
                        <div class="absolute right-0 top-0 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
                        <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 class="text-[#FFA500] font-bold uppercase tracking-widest text-xs mb-1">Club TechPerú Rewards</h3>
                                <div class="text-5xl font-extrabold mb-1 text-slate-900">${state.points} <span class="text-xl font-medium text-slate-400">Pts</span></div>
                                <div class="text-sm text-slate-500 mb-4">Equivale a progreso para tu siguiente recompensa.</div>
                                <div class="w-full md:w-64 h-3 bg-slate-100 rounded-full overflow-hidden mb-2 border border-slate-200">
                                    <div class="h-full bg-gradient-to-r from-orange-300 to-[#FFA500] transition-all duration-1000 shadow-[0_0_10px_#FFA500]" style="width: ${progress}%"></div>
                                </div>
                                <div class="text-xs text-slate-500 font-bold">${state.points} / 100 para canjear S/ 10.00</div>
                            </div>
                            <div class="bg-orange-50 backdrop-blur-md p-6 rounded-xl border border-orange-100 min-w-[200px] text-center shadow-sm">
                                <div class="text-xs text-slate-500 font-bold uppercase mb-2">Tu Saldo Monedero</div>
                                <div class="text-3xl font-bold text-slate-900 mb-4">S/ ${state.wallet.toFixed(2)}</div>
                                <button onclick="userActions.redeemPoints()" class="w-full bg-[#FFA500] hover:bg-orange-400 text-white font-bold py-2 rounded-lg text-sm transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" ${state.points < 100 ? 'disabled' : ''}>${state.points >= 100 ? 'Canjear Puntos' : 'Faltan Puntos'}</button>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div class="p-4 bg-blue-50 text-blue-600 rounded-xl"><i class="ph-bold ph-package text-3xl"></i></div>
                        <div><div class="text-2xl font-bold text-slate-900">${state.orders.length}</div><div class="text-sm text-slate-500 font-medium">Pedidos Realizados</div></div>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div class="p-4 bg-red-50 text-red-600 rounded-xl"><i class="ph-bold ph-heart text-3xl"></i></div>
                        <div><div class="text-2xl font-bold text-slate-900">${state.favorites.size}</div><div class="text-sm text-slate-500 font-medium">Favoritos Guardados</div></div>
                    </div>
                </div>
                <div class="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
                    <h3 class="font-bold text-xl mb-6 flex items-center gap-2 text-slate-800"><i class="ph-bold ph-user-circle"></i> Información Personal</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100"><label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label><div class="font-bold text-slate-800 text-lg mt-1">${userName}</div></div>
                        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100"><label class="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label><div class="font-bold text-slate-800 text-lg mt-1">${userEmail}</div></div>
                    </div>
                </div>`;

            // --- PESTAÑA PEDIDOS (AQUÍ HICE EL CAMBIO) ---
            } else if (tab === 'orders') {
                if (state.orders.length === 0) {
                    contentHTML = `<div class="bg-white rounded-2xl border border-slate-100 p-12 text-center"><div class="inline-block p-6 bg-slate-50 rounded-full mb-4"><i class="ph ph-package text-4xl text-slate-400"></i></div><h3 class="text-xl font-bold text-slate-900">Sin pedidos aún</h3><p class="text-slate-500 mb-6">Explora nuestra tienda y encuentra lo que buscas.</p><button onclick="router.navigate('/shop')" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-800">Ir a la Tienda</button></div>`;
                } else {
                    setTimeout(() => {
                        if(window.orderTimerInterval) clearInterval(window.orderTimerInterval);
                        window.orderTimerInterval = setInterval(() => {
                            const timers = document.querySelectorAll('.order-timer');
                            if(timers.length === 0) return;
                            timers.forEach(el => {
                                const expire = parseInt(el.dataset.expire);
                                const diff = expire - Date.now();
                                if(diff <= 0) {
                                    el.innerHTML = "Tiempo Agotado";
                                    el.parentElement.className = "mt-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded inline-block border border-red-100";
                                } else {
                                    const m = Math.floor(diff / 60000);
                                    const s = Math.floor((diff % 60000) / 1000);
                                    el.innerText = `${m}:${s < 10 ? '0' : ''}${s} min para validar pago`;
                                }
                            });
                        }, 1000);
                    }, 100);

                    contentHTML = `<div class="space-y-4">${state.orders.map((o, idx) => {
                        let timerHTML = '';
                        if(o.status === 'Pendiente de Validación' && o.expireAt) {
                            if(o.expireAt > Date.now()) {
                                timerHTML = `<div class="mt-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded inline-block border border-orange-100"><i class="ph-bold ph-clock"></i> <span class="order-timer" data-expire="${o.expireAt}">Calculando...</span></div>`;
                            } else {
                                timerHTML = `<div class="mt-2 text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded inline-block border border-red-100"><i class="ph-bold ph-warning"></i> Tiempo de reserva agotado</div>`;
                            }
                        }
                        
                        // Botón de Voucher (gris suave)
                        const voucherBtn = `<button onclick="userActions.downloadVoucher('${o.id}')" class="w-full md:w-auto text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 mb-2 md:mb-0"><i class="ph-bold ph-file-pdf text-lg"></i> Voucher</button>`;

                        let actionButtons = '';
                        
                        if (o.status === 'Aprobado') {
                            actionButtons = `
                            <div class="flex flex-col gap-2 w-full md:w-auto items-end">
                                <span class="text-2xl font-bold text-slate-900">S/ ${o.total.toFixed(2)}</span>
                                <div class="flex flex-col md:flex-row gap-2 w-full">
                                    ${voucherBtn}
                                    
                                    <button onclick="userActions.showOrderDetails('${o.id}')" class="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200 px-6 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-sm transform hover:-translate-y-0.5 whitespace-nowrap">
                                        <i class="ph-fill ph-star text-yellow-500"></i> Calificar / Detalles
                                    </button>
                                </div>
                            </div>`;
                        } else {
                            actionButtons = `
                            <div class="flex flex-col items-end gap-2 w-full md:w-auto">
                                <span class="text-2xl font-bold text-slate-900">S/ ${o.total.toFixed(2)}</span>
                                <div class="flex flex-col md:flex-row gap-2 w-full">
                                    ${voucherBtn}
                                    <button onclick="userActions.showOrderDetails('${o.id}')" class="text-sm bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 whitespace-nowrap"><i class="ph-bold ph-eye"></i> Ver Detalles</button>
                                </div>
                            </div>`;
                        }

                        // También cambié el borde al pasar el mouse (hover:border-[#FFA500]) para que salga Naranja en vez de turquesa
                        return `<div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#FFA500] transition-colors duration-300">
                            <div>
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="font-bold text-lg text-slate-900">Pedido #${o.id ? o.id.slice(-6) : (Date.now()-idx).toString().slice(-6)}</span>
                                    <span class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">${o.status}</span>
                                </div>
                                <div class="text-sm text-slate-500 mb-2"><i class="ph-bold ph-calendar-blank mr-1"></i> ${new Date(o.date).toLocaleDateString()} · ${new Date(o.date).toLocaleTimeString()}</div>
                                <div class="text-sm text-slate-700 font-medium">${o.items ? o.items.length : 0} productos</div>
                                ${timerHTML}
                            </div>
                            ${actionButtons}
                        </div>`;
                  
                    }).join('')}</div>`;
                }

            // --- PESTAÑA FAVORITOS ---
            } else if (tab === 'favorites') {
                if (favProducts.length === 0) contentHTML = `<div class="bg-white rounded-2xl border border-slate-100 p-12 text-center"><div class="inline-block p-6 bg-slate-50 rounded-full mb-4"><i class="ph ph-heart-break text-4xl text-slate-400"></i></div><h3 class="text-xl font-bold text-slate-900">Sin favoritos</h3><p class="text-slate-500">Guarda lo que te gusta para comprarlo después.</p></div>`;
                else contentHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${favProducts.map(ProductCard).join('')}</div>`;
            }

            // --- HTML PRINCIPAL (ESTRUCTURA) ---
            container.innerHTML = `
                <div class="w-full max-w-[1440px] mx-auto bg-white min-h-[80vh]">
                    <div class="relative w-full bg-gradient-to-b from-white to-slate-50 border-b border-slate-200 pt-12 pb-12 px-6 md:px-12 overflow-hidden">
                        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
                        <div class="relative z-10 flex flex-col md:flex-row items-center gap-8 max-w-7xl mx-auto">
                            <div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-900 text-[#FFA500] flex items-center justify-center text-4xl md:text-5xl font-extrabold shadow-xl border-4 border-white">${userInitial}</div>
                            <div class="text-center md:text-left">
                                <h1 class="text-3xl md:text-5xl font-extrabold mb-2 text-slate-900">Hola, ${userName}</h1>
                                <p class="text-slate-500 text-lg">${userEmail} · Miembro 2MTechPerú</p>
                            </div>
                            <div class="md:ml-auto">
                                <button onclick="authManager.logout()" class="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 px-6 py-3 rounded-full font-bold transition flex items-center gap-2 shadow-sm hover:shadow-md hover:text-red-500">
                                    <i class="ph-bold ph-sign-out"></i> Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="px-4 md:px-8 -mt-8 pb-12 relative z-20">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex flex-col lg:flex-row gap-8">
                                <div class="w-full lg:w-72 flex-shrink-0">
                                    <div class="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 sticky top-24">
                                        <nav class="space-y-1">
                                            <button onclick="router.navigate('/profile', {tab: 'summary'})" class="w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 font-bold ${tab==='summary' ? 'bg-[#FFA500] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}">
                                                <i class="ph-bold ph-user text-xl"></i> Resumen
                                            </button>
                                            <button onclick="router.navigate('/profile', {tab: 'orders'})" class="w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 font-bold ${tab==='orders' ? 'bg-[#FFA500] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}">
                                                <i class="ph-bold ph-package text-xl"></i> Mis Pedidos
                                            </button>
                                            <button onclick="router.navigate('/profile', {tab: 'favorites'})" class="w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 font-bold ${tab==='favorites' ? 'bg-[#FFA500] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}">
                                                <i class="ph-bold ph-heart text-xl"></i> Favoritos
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                                <div class="flex-1 fade-in">
                                    <h2 class="text-2xl font-bold text-slate-900 mb-6 capitalize hidden lg:block">${tab === 'summary' ? 'Resumen de tu cuenta' : tab === 'orders' ? 'Historial de compras' : 'Tus productos favoritos'}</h2>
                                    ${contentHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
        window.togglePass = () => {
            const input = document.getElementById('auth-pass');
            const icon = document.getElementById('pass-icon');
            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove('ph-eye-slash');
                icon.classList.add('ph-eye');
            } else {
                input.type = "password";
                icon.classList.remove('ph-eye');
                icon.classList.add('ph-eye-slash');
            }
        };

function renderLogin(container) {
            const isReg = authManager.isRegistering;
            container.innerHTML = `
                <div class="flex min-h-screen w-full bg-white">
                    <div class="hidden lg:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1950&q=80" class="absolute inset-0 w-full h-full object-cover opacity-50">
                        <div class="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
                        <div class="relative z-10 p-12 text-white max-w-lg">
                            <div class="flex items-center gap-3 mb-6"><i class="ph-fill ph-circuitry text-[#00979D] text-4xl"></i><h1 class="text-4xl font-extrabold tracking-tighter">Tech<span class="text-[#00979D]">Perú</span></h1></div>
                            <h2 class="text-5xl font-bold leading-tight mb-6">Tu tienda virtual de confianza y a un buen precio.</h2>
                            <p class="text-lg text-slate-300 mb-8">Únete a nuestra comunidad premium y accede a ofertas exclusivas en audio, fotografía y computación.</p>
                        </div>
                    </div>
                    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative bg-white">
                        <button onclick="router.navigate('/')" class="absolute top-8 left-8 text-slate-400 hover:text-slate-900 transition flex items-center gap-2 font-bold text-sm"><i class="ph-bold ph-arrow-left text-lg"></i> Volver al inicio</button>
                        <div class="w-full max-w-md space-y-8">
                            <div class="text-center lg:text-left"><h2 class="text-3xl md:text-4xl font-extrabold text-slate-900">${isReg?'Crear Cuenta':'Bienvenido de nuevo'}</h2><p class="text-slate-500 mt-2 text-lg">${isReg?'Empieza tu viaje tecnológico hoy.':'Ingresa tus datos para continuar.'}</p></div>
                            
                            <form id="auth-form" class="space-y-5">
                                ${isReg ? `<div class="space-y-2"><label class="text-sm font-bold text-slate-700 ml-1">Nombre Completo</label><div class="relative"><i class="ph-bold ph-user absolute left-4 top-4 text-slate-400 text-lg"></i><input type="text" id="reg-name" required placeholder="Ej. Saúl Perez" class="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white outline-none transition font-medium text-slate-900"></div></div>` : ''}
                                
                                <div class="space-y-2"><label class="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label><div class="relative"><i class="ph-bold ph-envelope absolute left-4 top-4 text-slate-400 text-lg"></i><input type="email" id="auth-email" required placeholder="hola@correo.com" class="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white outline-none transition font-medium text-slate-900"></div></div>
                                
                                <div class="space-y-2">
                                    <div class="flex justify-between ml-1"><label class="text-sm font-bold text-slate-700">Contraseña</label></div>
                                    <div class="relative">
                                        <i class="ph-bold ph-lock absolute left-4 top-4 text-slate-400 text-lg"></i>
                                        <input type="password" id="auth-pass" required placeholder="••••••••" class="w-full pl-12 pr-12 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white outline-none transition font-medium text-slate-900">
                                        <button type="button" onclick="togglePass()" class="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-900 transition z-10"><i id="pass-icon" class="ph-bold ph-eye-slash text-xl"></i></button>
                                    </div>
                                </div>

                                ${isReg ? `
                                <div class="space-y-2 animate-fade-in-up">
                                    <div class="flex justify-between ml-1"><label class="text-sm font-bold text-slate-700">Repetir Contraseña</label></div>
                                    <div class="relative">
                                        <i class="ph-bold ph-lock-key absolute left-4 top-4 text-slate-400 text-lg"></i>
                                        <input type="password" id="auth-pass-confirm" required placeholder="Confirma tu contraseña" class="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 focus:border-slate-900 focus:bg-white outline-none transition font-medium text-slate-900">
                                    </div>
                                </div>

                                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3 items-start animate-fade-in-up">
                                    <i class="ph-fill ph-warning text-yellow-600 text-xl mt-0.5"></i>
                                    <div class="text-xs text-yellow-800 leading-relaxed font-medium">
                                        <strong>¡Importante!</strong> Anota tu contraseña en un lugar seguro y no la compartas con nadie.
                                    </div>
                                </div>
                                ` : ''}

                                <button type="submit" class="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-xl hover:bg-slate-800 hover:scale-[1.02] transition transform active:scale-95">${isReg?'Registrarme Gratis':'Iniciar Sesión'}</button>
                            </form>
                            <p class="text-center text-slate-600 font-medium mt-8">${isReg?'¿Ya eres miembro?':'¿No tienes cuenta?'} <button id="toggle-auth" class="text-slate-900 font-bold hover:underline ml-1">${isReg?'Inicia Sesión':'Regístrate ahora'}</button></p>
                        </div>
                    </div>
                </div>`;
            document.getElementById('auth-form').addEventListener('submit', authManager.handleForm);
            document.getElementById('toggle-auth').onclick = () => { authManager.isRegistering = !isReg; renderLogin(container); };
        }

function renderFAQ(container) {
            // Iconos asignados manualmente por índice para que coincidan con tu data actual
            const icons = [
                "ph-truck",         // Para Envíos
                "ph-shield-check",  // Para Garantía
                "ph-storefront",    // Para Tienda Física
                "ph-credit-card"    // Para Pagos
            ];

            const faqHTML = FAQS.map((f, index) => {
                const icon = icons[index] || "ph-question"; // Fallback si agregas más preguntas
                
                return `
                <details class="group bg-white rounded-2xl border border-slate-100 shadow-sm open:shadow-md open:border-[#00979D] transition-all duration-300 overflow-hidden mb-4">
                    <summary class="flex items-center justify-between p-6 cursor-pointer select-none list-none bg-white group-open:bg-slate-50/50 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-open:bg-[#00979D] group-open:text-slate-900 group-open:border-[#00979D] transition-all duration-300 shrink-0">
                                <i class="ph-fill ${icon} text-xl"></i>
                            </div>
                            <h3 class="font-bold text-slate-900 text-base md:text-lg group-hover:text-yellow-600 transition-colors">${f.q}</h3>
                        </div>
                        <div class="text-slate-400 group-open:text-[#26E4ED] transform group-open:rotate-180 transition-transform duration-300">
                            <i class="ph-bold ph-caret-down text-xl"></i>
                        </div>
                    </summary>
                    <div class="px-6 pb-6 pt-2 bg-slate-50/50">
                        <div class="pl-14 text-slate-600 leading-relaxed text-sm md:text-base border-l-2 border-slate-200 ml-5">
                            ${f.a}
                        </div>
                    </div>
                </details>
                `;
            }).join('');

            container.innerHTML = `
                <div class="w-full max-w-[1440px] mx-auto px-4 md:px-8 py-12 bg-slate-50/50 min-h-[80vh]">
                    
                    <div class="max-w-3xl mx-auto text-center mb-16">
                        <span class="bg-yellow-100 text-cyan-800 border border-yellow-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Soporte 2MTP</span>
                        <h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">¿Cómo podemos ayudarte?</h1>
                        <p class="text-slate-500 text-lg">Resolvemos tus dudas sobre envíos, garantías y métodos de pago al instante.</p>
                    </div>

                    <div class="max-w-3xl mx-auto">
                        ${faqHTML}
                    </div>

                    <div class="max-w-3xl mx-auto mt-12">
                        <div class="bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left shadow-2xl">
                            <div class="absolute top-0 right-0 w-64 h-64 bg-[#00979D] rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none"></div>
                            
                            <div class="relative z-10">
                                <h3 class="text-2xl font-bold text-white mb-2">¿No encuentras tu respuesta?</h3>
                                <p class="text-slate-400">Nuestro equipo de expertos está listo para atenderte personalmente.</p>
                            </div>
                            
                            <div class="relative z-10 shrink-0">
                                <a href="https://wa.me/51960436357" target="_blank" class="bg-[#00979D] hover:bg-[#09BFED] text-slate-900 px-8 py-4 rounded-xl font-bold transition shadow-lg shadow-[#00979D]/20 flex items-center justify-center gap-3 hover:scale-105 active:scale-95">
                                    <i class="ph-fill ph-whatsapp-logo text-xl"></i>
                                    Chatear ahora
                                </a>
                            </div>
                        </div>
                        
                        <div class="text-center mt-8">
                            <p class="text-xs text-slate-400 font-medium">Tiempo de respuesta promedio: <span class="text-green-600 font-bold">Menos de 5 minutos</span></p>
                        </div>
                    </div>

                </div>`;
        }

        // --- LÓGICA DEL BANNER DE PUNTOS (SIEMPRE APARECE) ---
        window.closePointsBanner = () => {
            const b = document.getElementById('points-promo-banner');
            if(b) {
                b.classList.add('translate-y-full'); 
            }
        };

        setTimeout(() => {
            const b = document.getElementById('points-promo-banner');
            if(b) {
                b.classList.remove('translate-y-full'); 
            }
        }, 3000);

        window.addEventListener('popstate', router.handle);
        window.addEventListener('DOMContentLoaded', () => { 
            setTimeout(() => {
                const splash = document.getElementById('splash-screen');
                if(splash) {
                    splash.classList.add('splash-fade-out'); 
                    setTimeout(() => splash.remove(), 500);   
                }
            }, 2000); 
            router.handle(); 


       // --- LÓGICA DE BUSCADOR EN VIVO ---
        const setupSearch = () => {
            const input = document.getElementById('global-search');
            const results = document.getElementById('search-results');
            
            if(!input || !results) return;

// 1. Evento al Escribir (Live Search)
            input.addEventListener('input', (e) => {
                // LIMPIEZA: Convertir a minúsculas y quitar tildes
                const term = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                
                // Si borra todo, ocultamos resultados
                if(term.length < 1) {
                    results.classList.add('hidden');
                    return;
                }

                // Filtramos productos (Nombre o Categoría) usando los datos limpios
                const matches = PRODUCTS.filter(p => {
                    const cleanName = (p.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const cleanCat = (p.category || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return cleanName.includes(term) || cleanCat.includes(term);
                }).slice(0, 5); // Mostramos máximo 5


                if(matches.length === 0) {
                    results.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs font-bold">No encontramos coincidencias</div>`;
                } else {
                    results.innerHTML = matches.map(p => `
                        <div onclick="router.navigate('product', {product: '${p.slug}'}); document.getElementById('global-search').value = ''; document.getElementById('search-results').classList.add('hidden');" class="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition group">
                            <img src="${p.image}" class="w-10 h-10 object-cover rounded-lg border border-slate-100 group-hover:scale-105 transition">
                            <div class="flex-1 min-w-0">
                                <h4 class="text-sm font-bold text-slate-800 truncate">${p.name}</h4>
                                <div class="flex justify-between items-center mt-1">
                                    <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-100 px-1.5 rounded">${p.category}</span>
                                    <span class="text-xs font-bold text-slate-900">S/ ${p.isOffer ? p.offerPrice : p.price}</span>
                                </div>
                            </div>
                        </div>
                    `).join('') + `<div onclick="router.navigate('shop', {search: '${term}'}); document.getElementById('global-search').value = ''; document.getElementById('search-results').classList.add('hidden');" class="p-3 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer bg-slate-50 transition border-t border-slate-100">Ver todos los resultados <i class="ph-bold ph-arrow-right"></i></div>`;
                }
                results.classList.remove('hidden');
            });

            // 2. Evento Enter (Ir a la tienda y borrar texto)
            input.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') {
                    const term = input.value.trim();
                    if(term) {
                        router.navigate('shop', { search: term }); // Enviamos búsqueda por URL
                        input.value = ''; // Borramos texto visualmente
                        results.classList.add('hidden'); // Ocultamos lista
                        input.blur(); // Quitamos foco
                    }
                }
            });

            // 3. Ocultar al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !results.contains(e.target)) {
                    results.classList.add('hidden');
                }
            });
        };

        // Inicializar buscador
        setupSearch();


        });




    (function initUbigeoSimple() {
        const deptSelect = document.getElementById('bill-dept');
        
        // Lista simple de Departamentos
        const departamentos = [
            "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", 
            "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", 
            "La Libertad", "Lambayeque", "Lima", "Loreto", "Madre de Dios", 
            "Moquegua", "Pasco", "Piura", "Puno", "San Martín", "Tacna", 
            "Tumbes", "Ucayali"
        ];

        // Llenar el select automáticamente
        deptSelect.innerHTML = '<option value="">Seleccione Departamento</option>';
        departamentos.forEach(dept => {
            deptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
        });
    })();

function renderHowToBuy(container) {
    container.innerHTML = `
        <div class="w-full bg-slate-50 min-h-screen font-sans pb-32 overflow-hidden relative">
            
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-white to-transparent"></div>
                <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply"></div>
                <div class="absolute top-20 right-0 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[100px] mix-blend-multiply"></div>
            </div>

            <div class="relative z-10 pt-24 pb-20 px-6 text-center">
                <span class="inline-block py-1 px-3 rounded-full bg-white border border-slate-200 text-[#00979D] text-xs font-bold tracking-[0.2em] uppercase mb-5 shadow-sm">
                    Guía de Compra
                </span>
                <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight">
                    Compra en <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00979D] to-blue-600">4 Pasos.</span>
                </h1>
                <p class="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                    Sin cajas negras. Sin registros eternos. Una experiencia de compra fluida y transparente.
                </p>
            </div>

            <div class="max-w-[1440px] mx-auto px-6 relative z-10">
                
                <div class="hidden lg:block absolute top-[85px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0"></div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    
                    <div onclick="router.navigate('/shop')" class="group cursor-pointer relative text-center pt-8">
                        <div class="relative z-10 flex flex-col items-center">
                            <div class="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-4xl text-slate-400 mb-6 transition-all duration-500 group-hover:border-cyan-400 group-hover:text-cyan-500 group-hover:shadow-[0_10px_30px_-10px_rgba(6,182,212,0.5)] group-hover:-translate-y-2 relative z-20">
                                <i class="ph-fill ph-magnifying-glass transform group-hover:scale-110 transition-transform"></i>
                                <div class="absolute -top-3 -right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-cyan-500 transition-all shadow-sm">1</div>
                            </div>

                            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-cyan-600 transition-colors">Elige tu producto</h3>
                            <p class="text-slate-500 text-sm leading-relaxed px-4 group-hover:text-slate-600 transition-colors">
                                Explora nuestro catálogo y añade lo que necesites al carrito.
                            </p>
                        </div>
                    </div>

                    <div class="group relative text-center pt-8">
                        <div class="relative z-10 flex flex-col items-center">
                            <div class="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-4xl text-slate-400 mb-6 transition-all duration-500 group-hover:border-purple-400 group-hover:text-purple-500 group-hover:shadow-[0_10px_30px_-10px_rgba(168,85,247,0.5)] group-hover:-translate-y-2 relative z-20">
                                <i class="ph-fill ph-note-pencil transform group-hover:scale-110 transition-transform"></i>
                                <div class="absolute -top-3 -right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-all shadow-sm">2</div>
                            </div>

                            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">Datos de Envío</h3>
                            <p class="text-slate-500 text-sm leading-relaxed px-4 group-hover:text-slate-600 transition-colors">
                                Llena el formulario express en el checkout. Solo lo necesario.
                            </p>
                        </div>
                    </div>

                    <div class="group relative text-center pt-8">
                        <div class="relative z-10 flex flex-col items-center">
                            <div class="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-4xl text-slate-400 mb-6 transition-all duration-500 group-hover:border-amber-400 group-hover:text-amber-500 group-hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.5)] group-hover:-translate-y-2 relative z-20">
                                <i class="ph-fill ph-qr-code transform group-hover:scale-110 transition-transform"></i>
                                <div class="absolute -top-3 -right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all shadow-sm">3</div>
                            </div>

                            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors">Pago QR</h3>
                            <p class="text-slate-500 text-sm leading-relaxed px-4 group-hover:text-slate-600 transition-colors">
                                Paga al instante con Yape/Plin e ingresa tu código de operación.
                            </p>
                        </div>
                    </div>

                    <div class="group relative text-center pt-8">
                        <div class="relative z-10 flex flex-col items-center">
                            <div class="w-20 h-20 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-4xl text-slate-400 mb-6 transition-all duration-500 group-hover:border-green-400 group-hover:text-green-500 group-hover:shadow-[0_10px_30px_-10px_rgba(34,197,94,0.5)] group-hover:-translate-y-2 relative z-20">
                                <i class="ph-fill ph-whatsapp-logo transform group-hover:scale-110 transition-transform"></i>
                                <div class="absolute -top-3 -right-3 w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-200 group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500 transition-all shadow-sm">4</div>
                            </div>

                            <h3 class="text-2xl font-bold text-slate-900 mb-3 group-hover:text-green-600 transition-colors">Confirmación</h3>
                            <p class="text-slate-500 text-sm leading-relaxed px-4 group-hover:text-slate-600 transition-colors">
                                Envía la captura por WhatsApp y tu pedido sale en camino.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <div class="mt-20 text-center relative z-10 px-6">
                <button onclick="router.navigate('/shop')" class="group bg-slate-900 text-white text-lg font-bold px-10 py-4 rounded-full hover:bg-[#00979D] hover:text-white transition-all duration-300 shadow-xl shadow-slate-900/10 hover:shadow-[#00979D]/30 flex items-center justify-center mx-auto gap-3">
                    <span>Comenzar Ahora</span>
                    <i class="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>
                <p class="mt-6 text-slate-400 text-sm font-medium">
                    Soporte en tiempo real <a href="https://wa.me/51960436357" target="_blank" class="text-slate-900 hover:text-[#00979D] transition-colors font-bold underline decoration-2">aquí</a>
                </p>
            </div>
            
        </div>`;
}


function renderAbout(container) {
    container.innerHTML = `
        <div class="w-full bg-white min-h-screen font-sans selection:bg-[#00979D] selection:text-slate-900 pb-20">
            
            <div class="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center fade-in">
                <span class="text-[#26E4ED] font-bold tracking-[0.2em] text-xs uppercase mb-6 block">Nuestra Filosofía</span>
                <h1 class="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">
                    Tecnología con <br><span class="text-slate-400">trato humano.</span>
                </h1>
                <p class="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                    En un mundo lleno de bots y respuestas automáticas, apostamos por volver a lo básico: escucharte, asesorarte y cumplir lo que prometemos.
                </p>
            </div>

            <div class="relative w-full bg-slate-50 py-24 px-4 md:px-8">
                
                <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
                    <div class="absolute top-10 right-10 w-64 h-64 bg-[#00979D]/10 rounded-full blur-3xl"></div>
                    <div class="absolute bottom-10 left-10 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
                </div>

                <div class="relative z-10 max-w-3xl mx-auto bg-white p-10 md:p-16 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                    
                    <div class="flex flex-col items-center text-center mb-10">
                        <div class="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-[#00979D] text-3xl mb-6 shadow-lg">
                            <i class="ph-fill ph-quotes"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-slate-900">¿Por qué 2MTechPerú?</h2>
                        <span class="text-slate-400 text-sm font-medium mt-2 uppercase tracking-widest">Nota del Fundador</span>
                    </div>

                    <div class="prose prose-lg prose-slate mx-auto text-slate-600 leading-loose text-lg text-center md:text-left">
                        <p class="mb-6">
                            <span class="font-bold text-slate-900 text-2xl block mb-2">Hola, somos 2MTechPerú.</span>
                            Como tú, soy un apasionado de la tecnología. Y como tú, me cansé de comprar online y recibir mala atención, demoras o productos que no eran lo que prometían.
                        </p>
                        <p class="mb-6">
                            Decidí dejar de quejarme y empezar a construir la solución. <strong class="text-slate-900 bg-yellow-100 px-1">2MTechPerú nace hoy</strong> no para ser "una tienda más", sino para ser la tienda donde a mí me gustaría comprar.
                        </p>
                        <p class="mb-8">
                            Quizás somos nuevos, pero nuestras ganas de hacer las cosas bien son gigantes. Te invito a ser parte de nuestros <strong>primeros clientes fundadores</strong> y vivir la experiencia TechPerú.
                        </p>
                        <p class="text-2xl font-black text-slate-900 italic">
                            "No te vamos a fallar."
                        </p>
                    </div>

                    <div class="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div class="flex items-center gap-4">
                            <div class="h-12 w-12 rounded-full bg-slate-200 overflow-hidden">
                                <div class="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold">2MTP</div>
                            </div>
                            <div class="text-left">
                                <div class="font-bold text-slate-900 font-handwriting text-xl">2MTechPerú</div>
                                <div class="text-xs text-slate-400 uppercase font-bold tracking-wider">Fundador</div>
                            </div>
                        </div>
                        
                        <div class="opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                             <div class="h-10 px-4 border border-slate-300 rounded-full flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <i class="ph-fill ph-seal-check text-[#26E4ED] text-lg"></i> Compromiso con nuestros clientes.
                             </div>
                        </div>
                    </div>

                </div>
            </div>

            <div class="max-w-4xl mx-auto px-6 py-24">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    
                    <div class="group">
                        <div class="text-slate-900 text-3xl mb-4 group-hover:-translate-y-1 transition-transform duration-300 inline-block">
                            <i class="ph-fill ph-star"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-2">Calidad Original</h3>
                        <p class="text-slate-500 text-sm leading-relaxed">Solo productos sellados y verificados. Sin imitaciones.</p>
                    </div>

                    <div class="group">
                        <div class="text-slate-900 text-3xl mb-4 group-hover:-translate-y-1 transition-transform duration-300 inline-block">
                            <i class="ph-fill ph-lightning"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-2">Rapidez</h3>
                        <p class="text-slate-500 text-sm leading-relaxed">Tu tiempo vale. Procesamos tu pedido el mismo día.</p>
                    </div>

                    <div class="group">
                        <div class="text-slate-900 text-3xl mb-4 group-hover:-translate-y-1 transition-transform duration-300 inline-block">
                            <i class="ph-fill ph-heart"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mb-2">Transparencia</h3>
                        <p class="text-slate-500 text-sm leading-relaxed">Hablamos claro. Sin letras chicas ni costos ocultos.</p>
                    </div>

                </div>

                <div class="mt-20 text-center border-t border-slate-100 pt-16">
                    <h3 class="text-2xl font-bold text-slate-900 mb-6">¿Listo para probar algo diferente?</h3>
                    <button onclick="router.navigate('/shop')" class="bg-slate-900 text-white px-10 py-4 rounded-full font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 transform hover:-translate-y-1">
                        Ver Catálogo
                    </button>
                </div>
            </div>

        </div>
    `;
}


// --- FUNCIÓN PARA ABRIR GALERÍA DE SERVICIOS (AGREGAR ESTO) ---
window.openServiceGallery = (serviceIndex, imgIndex) => {
    // Verificamos que los datos existan
    if (!SERVICES_DATA || !SERVICES_DATA.items) return;

    const service = SERVICES_DATA.items[serviceIndex];
    if (!service) return;

    // Preparamos las imágenes para el visor
    let images = [];
    if (service.images && Array.isArray(service.images) && service.images.length > 0) {
        images = service.images;
    } else if (service.image) {
        images = [service.image];
    } else {
        return; 
    }

    // Usamos el gestor de imágenes que ya tienes en la tienda
    window.currentProdImages = images;
    window.currentProdIdx = imgIndex;

    // Abrimos el modal
    if(window.imageModalManager) {
        window.imageModalManager.open(images[imgIndex]);
    }
};

// BUSCA LA FUNCIÓN renderServices Y REEMPLÁZALA POR ESTA:

function renderServices(container) {
    if (!SERVICES_DATA || !SERVICES_DATA.enabled) {
        container.innerHTML = `<div class="min-h-screen flex items-center justify-center text-slate-400 font-bold">Sección no disponible</div>`;
        return;
    }

    const { pageTitle, whatsapp, items } = SERVICES_DATA;
    // Este es el número de respaldo (general)
    const globalWhatsapp = whatsapp || '51960436357';

    let servicesHTML = '';
    
if (items && Array.isArray(items) && items.length > 0) {
        
        // --- FILTRO DE VISIBILIDAD (NUEVO) ---
        // Solo mostramos los servicios que NO tengan isVisible = false
        const visibleItems = items.filter(item => item.isVisible !== false);

        if (visibleItems.length === 0) {
            servicesHTML = `<div class="text-center py-20 text-slate-400">Pronto publicaremos nuevos servicios.</div>`;
        } else {
            servicesHTML = visibleItems.map((item, index) => {
                const isEven = index % 2 === 0;
                
                // --- LOGICA DE WHATSAPP INDEPENDIENTE ---
                const itemPhone = (item.whatsapp && item.whatsapp.trim() !== '') ? item.whatsapp : globalWhatsapp;

                // --- ESTILOS ROTATIVOS ---
                let bgClass = '', textTitle = '', textBody = '', btnStyle = '';
                
                if (index % 3 === 0) { // Estilo Oscuro
                    bgClass = 'bg-slate-900'; textTitle = 'text-white'; textBody = 'text-slate-300';
                    btnStyle = 'bg-[#00979D] text-slate-900 hover:bg-white';
                } else if (index % 3 === 1) { // Estilo Blanco
                    bgClass = 'bg-white'; textTitle = 'text-slate-900'; textBody = 'text-slate-600';
                    btnStyle = 'bg-slate-900 text-white hover:bg-[#00979D] hover:text-slate-900';
                } else { // Estilo Gris
                    bgClass = 'bg-slate-100'; textTitle = 'text-slate-800'; textBody = 'text-slate-500';
                    btnStyle = 'bg-slate-900 text-white hover:bg-[#00979D]';
                }

                // --- EFECTO CORTE DE PAPEL ---
                const isLast = index === visibleItems.length - 1; // Usamos visibleItems.length
                const clipStyle = isLast ? '' : 'clip-path: polygon(0 0, 100% 0, 100% 90%, 0 100%); padding-bottom: 8rem; margin-bottom: -4rem;';
                const zIndex = `z-[${30 - index}]`; 

                // --- IMÁGENES ---
                let imagesArray = [];
                if(item.images && Array.isArray(item.images) && item.images.length > 0) {
                    imagesArray = item.images;
                } else if (item.image) {
                    imagesArray = [item.image];
                } else {
                    imagesArray = ['https://via.placeholder.com/800x600?text=TechPerú'];
                }

                const sliderId = `srv-slider-${index}`;
                
                const slidesHTML = imagesArray.map((img, i) => `
                    <img src="${img}" 
                         class="service-slide ${i === 0 ? 'active' : ''} object-cover w-full h-full cursor-zoom-in" 
                         data-index="${i}"
                         onclick="openServiceGallery(${index}, ${i})"> 
                `).join('');
                
                const dotsHTML = imagesArray.length > 1 ? `
                    <div class="slider-dots">
                        ${imagesArray.map((_, i) => `<div class="slider-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
                    </div>
                ` : '';
                const scriptInit = imagesArray.length > 1 ? `data-autoplay="true"` : '';

                // --- ORDEN VISUAL ---
                const orderImg = isEven ? 'lg:order-2' : 'lg:order-1';
                const orderTxt = isEven ? 'lg:order-1' : 'lg:order-2';
                const serviceNumber = (index + 1).toString().padStart(2, '0');

                return `
                <div class="relative w-full ${bgClass} ${zIndex} pt-20 px-6 md:px-12" style="${clipStyle}">
                    <div class="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        
                        <div class="w-full lg:w-1/2 ${orderTxt} text-center lg:text-left reveal-on-scroll">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-[#00979D] text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                                <span class="w-2 h-2 rounded-full bg-[#00979D] animate-pulse"></span>
                                Servicio ${serviceNumber}
                            </div>
                            
                            <h2 class="text-4xl md:text-5xl lg:text-6xl font-black ${textTitle} mb-6 leading-tight tracking-tight">
                                ${item.title || 'Sin Título'}
                            </h2>
                            
                            <p class="text-xl md:text-2xl ${textBody} leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 whitespace-pre-line" 
                               style="font-family: 'Josefin Sans', sans-serif; font-weight: 300;">
                                ${item.desc || item.description || ''}
                            </p>

                            <a href="https://wa.me/${itemPhone}?text=Hola,%20me%20interesa%20el%20servicio%20de:%20${encodeURIComponent(item.title)}" target="_blank" 
                               class="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group/btn ${btnStyle}">
                                <span>Solicitar Cotización</span>
                                <i class="ph-bold ph-whatsapp-logo text-xl group-hover/btn:animate-bounce"></i>
                            </a>
                        </div>

                        <div class="w-full lg:w-1/2 ${orderImg} reveal-on-scroll">
                            <div class="relative group">
                                <div class="absolute inset-0 bg-[#00979D] blur-3xl opacity-20 rounded-full"></div>
                                
                                <div class="relative overflow-hidden rounded-[2.5rem] shadow-2xl aspect-[4/3] bg-slate-800 service-slider-container border-4 border-white/10" id="${sliderId}" ${scriptInit}>
                                    ${slidesHTML}
                                    ${dotsHTML}
                                </div>
                                
                                <div class="absolute -bottom-6 -right-6 z-50 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 hidden md:flex items-center justify-center animate-bounce" style="animation-duration: 4s;">
                                    <div class="text-center leading-none">
                                        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">REF</span>
                                        <span class="block text-4xl font-black text-[#00979D] tracking-tighter">#${serviceNumber}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    ${isLast ? '<div class="h-24"></div>' : ''}
                </div>
                `;
            }).join('');
        }
    } else {
        servicesHTML = `<div class="text-center py-20 text-slate-400">No hay servicios registrados aún.</div>`;
    }
    container.innerHTML = `
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600&display=swap" rel="stylesheet">

        <div class="w-full bg-slate-900 min-h-screen font-sans overflow-x-hidden">
            <div class="relative pt-32 pb-32 px-6 overflow-hidden">
                <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: radial-gradient(#00979D 1px, transparent 1px); background-size: 40px 40px;"></div>
                <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00979D] rounded-full blur-[120px] opacity-20 mix-blend-screen pointer-events-none"></div>

                <div class="max-w-5xl mx-auto text-center relative z-10 fade-in">
                    <p class="text-[#00979D] font-bold tracking-[0.3em] text-xs uppercase mb-6 animate-pulse bg-slate-800/50 inline-block px-4 py-1 rounded-full border border-slate-700">Soluciones Profesionales</p>
                    <h1 class="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
                        ${pageTitle || 'Nuestros<br><span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00979D] to-blue-500">Servicios</span>'}
                    </h1>
                    <p class="text-slate-400 text-lg max-w-2xl mx-auto">
                        Soporte y proyectos a medida con la garantía de 2MTECHPERÚ.
                    </p>
                </div>
            </div>

            <div class="flex flex-col relative">
                ${servicesHTML}
            </div>
        </div>
        
        <div id="product-zoom-modal" class="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-md hidden opacity-0 transition-opacity duration-300 flex items-center justify-center">
            <button onclick="imageModalManager.close()" class="absolute top-4 right-4 z-[60] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"><i class="ph-bold ph-x text-3xl"></i></button>
            <button onclick="imageModalManager.prev()" class="absolute left-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/10 hover:border-white/30"><i class="ph-bold ph-caret-left text-3xl"></i></button>
            <button onclick="imageModalManager.next()" class="absolute right-4 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm border border-white/10 hover:border-white/30"><i class="ph-bold ph-caret-right text-3xl"></i></button>
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-slate-800/80 backdrop-blur px-6 py-3 rounded-full border border-slate-700 shadow-2xl">
                <button onclick="imageModalManager.zoomOut()" class="text-white hover:text-[#00979D] transition" title="Alejar"><i class="ph-bold ph-minus"></i></button>
                <div class="w-px h-4 bg-slate-600"></div>
                <button onclick="imageModalManager.reset()" class="text-white hover:text-[#00979D] transition text-xs font-bold uppercase tracking-wider" title="Restablecer">Reset</button>
                <div class="w-px h-4 bg-slate-600"></div>
                <button onclick="imageModalManager.zoomIn()" class="text-white hover:text-[#00979D] transition" title="Acercar"><i class="ph-bold ph-plus"></i></button>
            </div>
            <div id="zoom-pan-container" class="w-full h-full flex items-center justify-center overflow-hidden cursor-move p-4">
                <img id="zoom-modal-img" src="" class="max-w-full max-h-[90vh] object-contain select-none shadow-2xl origin-center transition-opacity duration-200">
            </div>
        </div>
    `;

    window.scrollTo(0,0);
    setTimeout(() => {
        if(window.initScrollAnimations) window.initScrollAnimations();
        if(window.initServiceSliders) window.initServiceSliders(); 
    }, 100);
}
// --- FUNCIÓN PARA ANIMAR SLIDERS DE SERVICIOS ---
window.initServiceSliders = () => {
    // Buscar todos los sliders que tengan autoplay activado
    const sliders = document.querySelectorAll('.service-slider-container[data-autoplay="true"]');
    
    sliders.forEach(slider => {
        let currentIndex = 0;
        const slides = slider.querySelectorAll('.service-slide');
        const dots = slider.querySelectorAll('.slider-dot');
        const totalSlides = slides.length;

        // Limpiar intervalo previo si existía (por seguridad)
        if(slider.dataset.interval) clearInterval(slider.dataset.interval);

        const nextSlide = () => {
            // Ocultar actual
            slides[currentIndex].classList.remove('active');
            if(dots[currentIndex]) dots[currentIndex].classList.remove('active');

            // Calcular siguiente
            currentIndex = (currentIndex + 1) % totalSlides;

            // Mostrar siguiente
            slides[currentIndex].classList.add('active');
            if(dots[currentIndex]) dots[currentIndex].classList.add('active');
        };

        // Configurar intervalo cada 4 segundos
        const intervalId = setInterval(nextSlide, 4000);
        slider.dataset.interval = intervalId; // Guardar ID para poder limpiarlo si hace falta
    });
};


// --- FUNCIÓN TÉRMINOS Y CONDICIONES (MODAL) ---
window.showTerms = () => {
    Swal.fire({
        title: '',
        width: '800px', // Un poco más ancho para leer mejor
        html: `
            <div class="text-left font-sans">
                <h2 class="text-2xl font-black text-slate-900 mb-6 text-center">Términos del Servicio</h2>
                
                <div class="space-y-6 text-sm text-slate-600 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    
                    <div class="bg-cyan-50 p-4 rounded-xl border border-yellow-200 text-yellow-800 text-xs font-bold mb-4">
                        <i class="ph-fill ph-info"></i> Última actualización
                    </div>

                    <section>
                        <h3 class="font-bold text-slate-900 text-base mb-2">1. Generalidades</h3>
                        <p>Bienvenido a <strong>2MTechPerú</strong>. Al realizar una compra con nosotros, aceptas estos términos. Nos especializamos en la venta de hardware, componentes y gadgets tecnológicos con garantía oficial.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-slate-900 text-base mb-2">2. Proceso de Compra y Pagos</h3>
                        <ul class="list-disc ml-4 space-y-1">
                            <li>Todos los pedidos realizados en la web están sujetos a <strong>validación de stock</strong> y pago.</li>
                            <li>Aceptamos Yape, Plin y Transferencias Bancarias.</li>
                            <li>Una vez generado el pedido, tienes un plazo máximo de <strong>30 minutos</strong> para enviar la constancia de pago vía WhatsApp.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 class="font-bold text-slate-900 text-base mb-2">3. Envíos y Entregas</h3>
                        <p class="mb-2">Realizamos envíos a todo el Perú mediante Olva Courier, Shalom o motorizado privado (solo Huánuco).</p>
                        <ul class="list-disc ml-4 space-y-1">
                            <li><strong>Huánuco:</strong> Entrega en 24 a 48 horas hábiles.</li>
                            <li><strong>Provincias:</strong> Entrega entre 2 a 4 días hábiles dependiendo del destino.</li>
                            <li>2MTechPerú no se responsabiliza por demoras ocasionadas por la empresa de transporte (huelgas, desastres naturales, etc.), pero brindaremos soporte para el seguimiento.</li>
                        </ul>
                    </section>

                    <section>
                        <h3 class="font-bold text-slate-900 text-base mb-2">4. Política de Garantía (IMPORTANTE)</h3>
                        <p class="mb-2">Todos nuestros productos cuentan con <strong>12 meses de garantía</strong> por defectos de fábrica.</p>
                        <div class="bg-slate-100 p-3 rounded-lg border border-slate-200">
                            <strong>La garantía NO cubre:</strong>
                            <ul class="list-disc ml-4 mt-1 text-xs">
                                <li>Daños físicos (golpes, caídas, quiñes).</li>
                                <li>Daños por líquidos o humedad.</li>
                                <li>Manipulación indebida de hardware (pines doblados).</li>
                                <li>Sobrecargas eléctricas o uso de fuentes de poder genéricas inadecuadas.</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h3 class="font-bold text-slate-900 text-base mb-2">5. Cambios y Devoluciones</h3>
                        <p>Solo se aceptan cambios dentro de los primeros 7 días calendario si el producto presenta fallas de fábrica confirmadas por nuestro servicio técnico. El producto debe estar con su caja y accesorios originales en perfecto estado.</p>
                        <p class="mt-2 text-xs italic">*No realizamos devoluciones de dinero por "arrepentimiento de compra" una vez abierto el producto, debido a la naturaleza de los componentes tecnológicos.</p>
                    </section>

                    <section>
                        <h3 class="font-bold text-slate-900 text-base mb-2">6. Privacidad de Datos</h3>
                        <p>Tus datos personales (Nombre, DNI, Dirección) son utilizados únicamente para procesar el envío y emitir tu comprobante de pago. No compartimos tu información con terceros ajenos a la logística de entrega.</p>
                    </section>

                </div>
            </div>
        `,
        showCloseButton: true,
        showConfirmButton: true,
        confirmButtonText: 'He leído y acepto',
        confirmButtonColor: '#0f172a', // Color Slate-900
        focusConfirm: false,
        background: '#ffffff',
        backdrop: `rgba(15, 23, 42, 0.8)`
    });
};

// --- FUNCIÓN PARA ENVIAR EL FORMULARIO A WHATSAPP ---
window.handleContactSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // 1. Capturar los valores
    const name = document.getElementById('contact-name').value.trim();
    const subject = document.getElementById('contact-subject').value;
    const msg = document.getElementById('contact-msg').value.trim();

    if (!name || !msg) return Swal.fire('Faltan datos', 'Por favor completa tu nombre y mensaje.', 'warning');

    // 2. Construir el mensaje formateado
    // Usamos %0A para saltos de línea
    const fullMessage = `Hola TechPerú, soy *${name}*.\n\n` +
                        `📌 *Asunto:* ${subject}\n` +
                        `📝 *Mensaje:* ${msg}\n\n` +
                        `Espero su respuesta.`;

    // 3. Crear el enlace de WhatsApp
    // EncodeURIComponent asegura que los espacios y tildes funcionen bien
    const phoneNumber = "51960436357";
    const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fullMessage)}`;

    // 4. Abrir en nueva pestaña (abre App o WhatsApp Web)
    window.open(waLink, '_blank');

    // Opcional: Limpiar el formulario o mostrar éxito
    Swal.fire({
        icon: 'success',
        title: '¡Redirigiendo!',
        text: 'Abriendo WhatsApp para enviar tu mensaje...',
        timer: 2000,
        showConfirmButton: false
    });
    
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-msg').value = '';
};



    document.addEventListener("DOMContentLoaded", () => {
        const messages = [
            "🟢 Estamos en línea", 
            "👋 ¿En qué podemos ayudarte?", 
            "🔍 ¿Conseguiste lo que estabas buscando?"
        ];
        
        let msgIndex = 0;
        const labelContainer = document.getElementById('wa-rotating-label');
        const labelText = document.getElementById('wa-rotating-text');
        
        // Función para mostrar el mensaje
        const showMessage = () => {
            if(!labelContainer || !labelText) return;
            
            // 1. Actualizar texto
            labelText.innerText = messages[msgIndex];
            
            // 2. Mostrar (Quitar clases de oculto)
            labelContainer.classList.remove('opacity-0', 'translate-x-4');
            
            // 3. Esperar 5 segundos para que lo lean y luego ocultar
            setTimeout(() => {
                labelContainer.classList.add('opacity-0', 'translate-x-4');
                
                // Cambiar al siguiente mensaje para la próxima vuelta
                msgIndex = (msgIndex + 1) % messages.length;
            }, 5000); 
        };

        // INICIO DEL CICLO
        // Esperamos 3 segundos al cargar la página para el primer saludo
        setTimeout(() => {
            showMessage();
            
            // Luego programamos que se repita cada 2 minutos (120,000 milisegundos)
            // Esto evita que sea molesto
            setInterval(showMessage, 120000); 
            
        }, 3000);
    });


// Variables para controlar el scroll del header
let lastScrollTop = 0;
const mainHeader = document.getElementById('main-header');
let headerTicking = false;

window.addEventListener('scroll', function() {
    if (!headerTicking) {
        window.requestAnimationFrame(() => {
            let scrollTop = window.scrollY || document.documentElement.scrollTop;
            
            // Lógica del Header
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                mainHeader.classList.add('-translate-y-full');
            } else {
                mainHeader.classList.remove('-translate-y-full');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

            // Lógica del Botón Subir
            const scrollBtn = document.getElementById('scrollToTopBtn');
            if (scrollBtn) {
                if (scrollTop > 400) {
                    scrollBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
                } else {
                    scrollBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
                }
            }
            
            headerTicking = false;
        });
        headerTicking = true;
    }
}, { passive: true });

    window.addEventListener('scroll', () => {
        // Si bajamos más de 400px, aparece el botón
        if (window.scrollY > 400) {
            scrollBtn.classList.remove('opacity-0', 'invisible', 'translate-y-10');
        } else {
            // Si estamos arriba, se oculta
            scrollBtn.classList.add('opacity-0', 'invisible', 'translate-y-10');
        }
    });