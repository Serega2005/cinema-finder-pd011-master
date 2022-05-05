
/* ------------------------------------------------------------------------- *\
*                 Веб-приложение по поиску фильмов и сериалов
\* ------------------------------------------------------------------------- */

/* ---------------- Ввод данных от пользователя через форму ---------------- */

// Навигация и получение доступа к форме и элементам формы
const titleInput = document.getElementById('title-input');
const typeSelect = document.getElementById('type-select');
const genreSelect = document.getElementById('genre-select');
const searchButton = document.getElementById('search-button');
const statusOutput = document.getElementById('status-output');
const searchResultsContainer = document
    .getElementById('search-results-container');

// Входные данные для поиска
let title;
let type;
let genre;
let countries;


/* ------------- Асинхронный запрос и обработка событий формы -------------- */

// Асинхронная функция для отправки запроса и получения ответа
async function getCinemaInfo(url) {
    const response = await fetch(url, {
        headers: {
            'X-API-KEY': 'ddaadbdb-686d-4194-ba6e-cd6b7a171d5d'
        }
    });

    return await response.json();
}

// Массив всех результатов поиска
let generalSearchResults = [];

// Переменная текущей страницы результатов
let pageNumber = 1;

// Функция для обработка начального запроса
async function processInitialSearchRequest() {
    
    // Отмена запроса в случае отсутствия title
    if (!titleInput.value) {
        statusOutput.innerText = 'Empty title\nPlease enter title';
        return;
    }

    // Отмена запроса в случае повторения входных данных title и type
    if (titleInput.value == title &&
        typeSelect.value == type &&
        genreSelect.value == genre) {
        statusOutput.innerText = 'Repeated title and type\nPlease enter new ones';
        return;
    }

    // Отмена запроса в случае несоответствия title к шаблону
    const regexp = /^[a-zа-я0-9][a-zа-я0-9 ,.!?&\-:']+$/i;

    if (!regexp.test(titleInput.value)) {
        statusOutput.innerText =
            'Mistake in title\nTitle starts with letters, digits, please enter valid one';
        return;
    }

    // Входные данные для поиска
    title = titleInput.value;
    titleInput.value = '';
    type = String(typeSelect.value).toUpperCase();
    genre = genreSelect.value;
    countries = countriesSelect.value;
    pageNumber = 1;

    // Вывод поискового запроса
    statusOutput.innerText = `Search for ${type}\n"${title}"`;

    // Очистка результатов предыдущего поиска
    const cinemaCards = searchResultsContainer.querySelectorAll('.cinema-card');
    for (const cinemaCard of cinemaCards) {
        cinemaCard.remove();
    }

    // Формирование URL-адреса
    const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?keyword=${title}&type=${type}&genres=${genre}&countries=${countries}&page=${pageNumber}`;

    // Отправка запроса и получение ответа
    const response = await getCinemaInfo(url);
    console.log('response :>> ', response);
    
    // Получение верного ответа с сервера
    const searchResults = response.items;

    // Сохранение в массив всех результатов поиска
    generalSearchResults = [];
    generalSearchResults = generalSearchResults.concat(searchResults);
        
    // Обработка результатов поиска
    processSearchResults(searchResults);
}


// Обработка события клика по кнопке Search
searchButton.addEventListener('click', processInitialSearchRequest);

// Обработка события по нажатию на клавишу Enter
titleInput.addEventListener('keydown', function(event) {
    if (event.code == 'Enter') {
        processInitialSearchRequest();
    }
});


// Функция для обработка последующих запросов
async function processNextSearchRequest() {
    const availScrollHeight = document.documentElement.scrollHeight
        - document.documentElement.clientHeight;
    const currentScroll = Math.ceil(window.pageYOffset);

    if (currentScroll >= availScrollHeight) {        
        // Переменная текущей страницы результатов
        pageNumber += 1;

        // Формирование URL-адреса
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?type=${type}&keyword=${title}&genres=${genre}&page=${pageNumber}`;

        // Отправка запроса и получение ответа
        const response = await getCinemaInfo(url);
        
        // Получение верного ответа с сервера
        const searchResults = response.items;
        generalSearchResults = generalSearchResults.concat(searchResults);

        // Обработка результатов поиска
        processSearchResults(searchResults);
    }
}

// Обработка события прокрутки
document.addEventListener('scroll', processNextSearchRequest);


// Обработка результатов поиска
function processSearchResults(searchResults) {
    // ID фильмов в избранном
    const favoritesIDs = Object.keys(localStorage);
    
    for (const cinemaInfo of searchResults) {

        // Деструктуризация объекта фильма
        const { posterUrlPreview: poster, nameOriginal: title,
            ratingKinopoisk: rating, year, kinopoiskId } = cinemaInfo;

        const isFavorite = favoritesIDs.includes(String(kinopoiskId));

        // Создание новых HTML-элементов
        const cinemaCard = 
            `<div class="cinema-card" data-kinopoisk-id="${kinopoiskId}">
                <div class="poster">
                    <img src="${poster}" alt="Poster of ${title}">
                </div>
                <div class="info">
                    <div class="rating-favorite-container">
                        <p class="rating">${rating}</p>
                        <div
                            class="${ isFavorite ? "favorite-icon active" : "favorite-icon" }"
                        ></div>
                    </div>
                    <h6 class="title">${title}</h6>
                    <p class="year">${year}</p>
                </div>
            </div>`;

        // Вставка нового HTML-элемента
        searchResultsContainer.insertAdjacentHTML('beforeend', cinemaCard);
    }
}


// Функция для обработка последующих запросов
async function processFullCinemaInfo(cinemaCard) {
    // ID фильма в базе OMDb
    const kinopoiskId = cinemaCard.dataset.kinopoiskId;
    // Формирование URL-адреса
    const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kinopoiskId}`;

    // Отправка запроса и получение ответа
    const cinemaFullInfo = await getCinemaInfo(url);
    console.log('cinemaFullInfo :>> ', cinemaFullInfo);

    // Деструктуризация объекта
    const {
        posterUrl: poster,
        ratingKinopoisk: rating,
        nameOriginal: title,
        genres,
        countries,
        year,
        shortDescription: description,
        webUrl
    } = cinemaFullInfo;

    // Создание новых HTML-элементов
    const cinemaFullCard =
        `<div id="fixed-container">
            <div id="cinema-full-card">
                <div class="poster">
                    <img src="${poster}" alt="Poster of ${title}">
                </div>
                <div class="info">
                    <p class="rating">${rating}</p>
                    <h2 class="title">${title}</h2>
                    <h3 class="genre">
                        ${genres.map(item => item.genre)
                            .join(', ')
                            .replace(/^./, letter => letter.toUpperCase())}
                    </h3>
                    <h3 class="countries">
                        ${countries.map(item => item.country).join(', ')}
                    </h3>
                    <p class="year">${year}</p>
                    <p class="description">${description}</p>
                    <a href="${webUrl}" target="_blank">Link to Kinopoisk</a>
                </div>
                <button>&times;</button>
            </div>
        </div>`;
        
    // Вставка нового HTML-элемента
    document.body.insertAdjacentHTML('beforeend', cinemaFullCard);
    document.body.style.overflow = 'hidden';

    // Закрытие окна
    document.querySelector('#cinema-full-card button')
        .addEventListener(
            'click',
            function() {
                document.querySelector('#fixed-container').remove();
                document.body.style.overflow = '';
            },
            { once: true }
        );
}

// Функция управления избранным
function manageFavorites(favoriteIcon) {
    const kinopoiskId = favoriteIcon.closest('.cinema-card')
        .dataset.kinopoiskId;

    // Удаление из избранного
    if (favoriteIcon.classList.contains('active')) {
        favoriteIcon.classList.remove('active');

        localStorage.removeItem(kinopoiskId);
    }
    // Добавление в избранное
    else {
        favoriteIcon.classList.add('active');

        const cinemaInfo = generalSearchResults.find(
            cinemaInfo => cinemaInfo.kinopoiskId == kinopoiskId
        );

        localStorage.setItem(kinopoiskId, JSON.stringify(cinemaInfo));
    }

    console.log(localStorage);
}


// Обработка события клика по карточкам
searchResultsContainer.addEventListener('click', function(event) {
    // Иконка избранного
    if (event.target.classList.contains('favorite-icon')) {
        const favoriteIcon = event.target;
        manageFavorites(favoriteIcon);
    }
    // Карточка фильма
    else {
        const cinemaCard = event.target.closest('.cinema-card');
        if (cinemaCard) {
            processFullCinemaInfo(cinemaCard);
        }
    }
});

async function getFilters(){
        // Формирование URL-адреса
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/filters`;

        // Отправка запроса и получение ответа
        const response = await getCinemaInfo(url);
        console.log('response :>> ', response);
    
        console.log(`жанры`, response.genres);

        console.log(`страны`, response.countries);
    
}