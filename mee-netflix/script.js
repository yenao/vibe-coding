const API_KEY = "707c458b50e70efbf83a725042075312";
const API_URL = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=ko-KR&page=1`;
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const movieGrid = document.getElementById("movie-grid");
const statusElement = document.getElementById("status");

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";

  const posterPath = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : "https://via.placeholder.com/500x750?text=No+Image";
  const releaseDate = movie.release_date || "개봉일 정보 없음";

  card.innerHTML = `
    <div class="poster-wrapper">
      <img class="poster" src="${posterPath}" alt="${movie.title} 포스터" loading="lazy" />
    </div>
    <h2 class="title">${movie.title}</h2>
    <p class="release-date">개봉일: ${releaseDate}</p>
  `;

  return card;
}

async function fetchNowPlayingMovies() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    const movies = data.results || [];

    movieGrid.innerHTML = "";

    if (movies.length === 0) {
      statusElement.textContent = "현재 상영 중인 영화가 없습니다.";
      return;
    }

    statusElement.textContent = `${movies.length}개의 영화를 찾았습니다.`;
    movies.forEach((movie) => {
      movieGrid.appendChild(createMovieCard(movie));
    });
  } catch (error) {
    statusElement.textContent = "영화 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    console.error(error);
  }
}

fetchNowPlayingMovies();
