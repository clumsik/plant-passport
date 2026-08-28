// 국립세종수목원 식물도감 데이터
// 각 식물의 QR 푯말 URL 형식: https://도메인/?collect=plant_001

// 수목원 주요 구역 정의 (인터랙티브 지도용)
// x, y 값은 국립세종수목원 안내도 이미지(assets/sejong-map.png) 기준 0~100(%) 좌표
// 실제 지도의 시설 위치에 맞춰 배치
const ZONES = [
  { id: "greenhouse",  name: "사계절전시온실", color: "#3f9d5a", x: 27, y: 66 },
  { id: "bonsai",      name: "분재원",         color: "#8a6d3b", x: 54, y: 37 },
  { id: "garden",      name: "한국전통정원",   color: "#c47f3d", x: 43, y: 47 },
  { id: "rose",        name: "뭇꽃원",         color: "#d75d7c", x: 71, y: 42 },
  { id: "conifer",     name: "민속식물원",     color: "#2f6d4f", x: 84, y: 29 },
  { id: "herb",        name: "희귀특산식물전시온실", color: "#6fa03c", x: 64, y: 27 },
];

// 뱃지(업적) 정의
// 뱃지: 사용자별 랜덤 목표 5종 진행도(count) / 전체 완료(complete) 기준
const BADGES = [
  { id: "first_find",  name: "첫 식물 발견",  icon: "sprout",  desc: "첫 번째 목표 식물을 찾았어요.",          condition: { type: "count", value: 1 } },
  { id: "getting_warm", name: "탐험의 시작",  icon: "footprints", desc: "목표 식물 3종을 찾았어요.",            condition: { type: "count", value: 3 } },
  { id: "almost_there", name: "한 걸음 남았다", icon: "compass", desc: "목표 식물 4종을 찾았어요.",            condition: { type: "count", value: 4 } },
  { id: "sejong_explorer", name: "세종의 탐험가", icon: "award", desc: "내게 배정된 목표 식물을 모두 찾아 미션을 완료했어요!", condition: { type: "complete" } },
];

// 식물 데이터 (30종)
const PLANTS = [
  // 사계절온실
  { id: "plant_001", name: "극락조화", sci: "Strelitzia reginae", zone: "greenhouse", bloom: "겨울~봄", emoji: "🦜", hint: "온실 입구, 새를 닮은 주황색 꽃을 찾아보세요.", desc: "새가 날개를 편 듯한 화려한 꽃 모양 때문에 '극락조화'라 불려요. 남아프리카가 고향이랍니다." },
  { id: "plant_002", name: "부겐빌레아", sci: "Bougainvillea glabra", zone: "greenhouse", bloom: "봄~가을", emoji: "🌺", hint: "온실 벽면을 타고 오르는 분홍빛 넝쿨을 살펴보세요.", desc: "화려한 색은 꽃이 아니라 잎(포엽)이에요. 진짜 꽃은 가운데 작고 하얀 부분이랍니다." },
  { id: "plant_003", name: "몬스테라", sci: "Monstera deliciosa", zone: "greenhouse", bloom: "여름", emoji: "🌿", hint: "구멍 뚫린 커다란 잎을 가진 열대 식물을 찾으세요.", desc: "잎에 자연스럽게 구멍이 나 있어 '스위스 치즈 식물'이라고도 불려요." },
  { id: "plant_004", name: "히비스커스", sci: "Hibiscus rosa-sinensis", zone: "greenhouse", bloom: "여름~가을", emoji: "🌸", hint: "크고 붉은 나팔 모양 꽃을 온실 중앙에서 찾아보세요.", desc: "하와이를 상징하는 꽃으로, 차로 우려 마시기도 하는 열대의 대표 식물이에요." },
  { id: "plant_005", name: "칼라디움", sci: "Caladium bicolor", zone: "greenhouse", bloom: "여름", emoji: "🍃", hint: "하트 모양의 알록달록한 잎을 살펴보세요.", desc: "꽃보다 잎이 아름다운 관엽식물로, 잎마다 무늬가 모두 달라요." },

  // 분재원
  { id: "plant_006", name: "소나무 분재", sci: "Pinus densiflora", zone: "bonsai", bloom: "봄", emoji: "🌲", hint: "작은 화분 속 굽은 노송을 관찰해 보세요.", desc: "수십 년간 정성껏 다듬어진 소나무 분재는 한국 분재의 백미로 꼽혀요." },
  { id: "plant_007", name: "단풍나무 분재", sci: "Acer palmatum", zone: "bonsai", bloom: "봄", emoji: "🍁", hint: "손바닥 모양 잎을 가진 작은 나무를 찾아보세요.", desc: "가을이면 화분 속에서도 붉게 물드는 모습이 장관이에요." },
  { id: "plant_008", name: "주목 분재", sci: "Taxus cuspidata", zone: "bonsai", bloom: "봄", emoji: "🌳", hint: "붉은 열매가 달린 작은 침엽 분재를 살펴보세요.", desc: "'살아 천년 죽어 천년'이라 불릴 만큼 오래 사는 나무예요." },
  { id: "plant_009", name: "모과나무 분재", sci: "Chaenomeles sinensis", zone: "bonsai", bloom: "봄", emoji: "🍐", hint: "울퉁불퉁한 노란 열매가 열리는 분재를 찾아보세요.", desc: "향기로운 열매로 유명하며, 매끈한 얼룩 수피가 관상 포인트예요." },
  { id: "plant_010", name: "진달래 분재", sci: "Rhododendron mucronulatum", zone: "bonsai", bloom: "이른 봄", emoji: "🌷", hint: "이른 봄 분홍 꽃이 잎보다 먼저 피는 분재예요.", desc: "잎이 나기 전 연분홍 꽃이 먼저 피어 봄소식을 알려주는 우리 꽃이에요." },

  // 한국전통정원
  { id: "plant_011", name: "매화나무", sci: "Prunus mume", zone: "garden", bloom: "이른 봄", emoji: "🌼", hint: "연못가 정자 근처, 눈 속에서도 피는 꽃을 찾으세요.", desc: "선비의 지조를 상징하는 사군자 중 하나로, 추위 속에서도 꽃을 피워요." },
  { id: "plant_012", name: "배롱나무", sci: "Lagerstroemia indica", zone: "garden", bloom: "여름", emoji: "🌸", hint: "매끈한 줄기에 백일 동안 피는 분홍 꽃을 찾으세요.", desc: "꽃이 백일 동안 핀다 하여 '백일홍 나무'라고도 불려요." },
  { id: "plant_013", name: "연꽃", sci: "Nelumbo nucifera", zone: "garden", bloom: "여름", emoji: "🪷", hint: "전통 정원 연못 위에 뜬 큰 잎과 꽃을 살펴보세요.", desc: "진흙 속에서 피어도 물들지 않아 청정함의 상징으로 여겨져요." },
  { id: "plant_014", name: "대나무", sci: "Phyllostachys nigra", zone: "garden", bloom: "드물게", emoji: "🎋", hint: "바람에 서걱이는 곧은 대숲을 찾아보세요.", desc: "곧고 푸른 기상 덕에 사군자의 하나로 사랑받는 식물이에요." },
  { id: "plant_015", name: "국화", sci: "Chrysanthemum morifolium", zone: "garden", bloom: "가을", emoji: "🌻", hint: "가을 정원의 노랗고 하얀 겹꽃을 찾아보세요.", desc: "서리를 이기고 피어 절개를 상징하는 사군자의 하나예요." },

  // 장미원
  { id: "plant_016", name: "붉은 장미", sci: "Rosa 'Crimson'", zone: "rose", bloom: "봄~가을", emoji: "🌹", hint: "장미 아치문 아래 가장 붉은 꽃을 찾으세요.", desc: "사랑을 상징하는 대표적인 꽃으로, 향기와 색이 가장 진해요." },
  { id: "plant_017", name: "덩굴장미", sci: "Rosa 'Climbing'", zone: "rose", bloom: "봄~여름", emoji: "🌺", hint: "울타리를 타고 오르는 장미 넝쿨을 살펴보세요.", desc: "벽과 아치를 아름답게 뒤덮어 장미원의 터널을 만들어요." },
  { id: "plant_018", name: "미니장미", sci: "Rosa chinensis 'Minima'", zone: "rose", bloom: "봄~가을", emoji: "🌷", hint: "손톱만 한 작은 장미 화단을 찾아보세요.", desc: "작지만 사계절 내내 꽃을 피우는 야무진 장미예요." },
  { id: "plant_019", name: "노랑장미", sci: "Rosa 'Golden'", zone: "rose", bloom: "봄~가을", emoji: "🌼", hint: "햇살처럼 노란 장미 무리를 찾아보세요.", desc: "우정과 기쁨을 상징하며 밝은 정원 분위기를 만들어줘요." },

  // 침엽수원
  { id: "plant_020", name: "구상나무", sci: "Abies koreana", zone: "conifer", bloom: "봄", emoji: "🌲", hint: "은빛 뒷면 잎을 가진 우리나라 특산 나무를 찾으세요.", desc: "한라산과 지리산에 자생하는 한국 특산 침엽수예요." },
  { id: "plant_021", name: "잣나무", sci: "Pinus koraiensis", zone: "conifer", bloom: "봄", emoji: "🌰", hint: "다섯 개씩 뭉친 긴 바늘잎과 큰 솔방울을 찾으세요.", desc: "고소한 잣을 맺는 나무로, 잎이 다섯 개씩 모여 나요." },
  { id: "plant_022", name: "메타세쿼이아", sci: "Metasequoia glyptostroboides", zone: "conifer", bloom: "봄", emoji: "🌳", hint: "하늘로 곧게 뻗은 삼각형 큰 나무를 올려다보세요.", desc: "'살아있는 화석'이라 불리며, 가을에 붉게 물드는 낙엽 침엽수예요." },
  { id: "plant_023", name: "전나무", sci: "Abies holophylla", zone: "conifer", bloom: "봄", emoji: "🎄", hint: "짙은 그늘을 드리우는 곧은 침엽수를 찾아보세요.", desc: "곧고 크게 자라 사찰 진입로에 많이 심는 상록수예요." },
  { id: "plant_024", name: "향나무", sci: "Juniperus chinensis", zone: "conifer", bloom: "봄", emoji: "🌲", hint: "비늘 같은 잎에서 은은한 향이 나는 나무를 찾으세요.", desc: "목재에서 향이 나 예부터 향으로 쓰였던 나무예요." },
  { id: "plant_025", name: "주목", sci: "Taxus cuspidata", zone: "conifer", bloom: "봄", emoji: "🔴", hint: "붉고 말랑한 열매가 달린 짧은 침엽수를 찾으세요.", desc: "붉은 헛씨껍질이 특징이며 매우 느리게 자라 오래 사는 나무예요." },

  // 약용식물원
  { id: "plant_026", name: "인삼", sci: "Panax ginseng", zone: "herb", bloom: "여름", emoji: "🌱", hint: "그늘막 아래 다섯 갈래 잎 식물을 찾아보세요.", desc: "한국을 대표하는 약초로, 뿌리가 사람 모양을 닮았다 하여 이름 붙었어요." },
  { id: "plant_027", name: "당귀", sci: "Angelica gigas", zone: "herb", bloom: "여름~가을", emoji: "🌿", hint: "짙은 자주색 우산 모양 꽃을 찾아보세요.", desc: "예부터 여성 건강에 좋은 약초로 알려진 자주빛 우산꽃 식물이에요." },
  { id: "plant_028", name: "도라지", sci: "Platycodon grandiflorus", zone: "herb", bloom: "여름", emoji: "🔔", hint: "별 모양 보라·흰 꽃과 풍선 봉오리를 찾아보세요.", desc: "봉오리가 풍선처럼 부풀어 '풍선꽃'이라고도 불리는 약초예요." },
  { id: "plant_029", name: "구절초", sci: "Dendranthema zawadskii", zone: "herb", bloom: "가을", emoji: "🌼", hint: "가을 들녘 하얀 국화 닮은 꽃을 찾아보세요.", desc: "가을을 대표하는 들국화로, 예부터 부인병 약재로 쓰였어요." },
  { id: "plant_030", name: "작약", sci: "Paeonia lactiflora", zone: "herb", bloom: "늦봄", emoji: "🌸", hint: "모란을 닮은 크고 탐스러운 겹꽃을 찾아보세요.", desc: "뿌리를 약재로 쓰며, 함박꽃이라 불릴 만큼 크고 화려한 꽃을 피워요." },
];
