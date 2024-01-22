#extension GL_EXT_gpu_shader4 : enable

/************************************************************************************/
/* Блок объявления переменных, которые загружаются из основной программы и констант	*/
/* u_resolution - Размеры окна, u_mouse - координаты направления камеры				*/
/* u_position - координаты камеры, u_skyTexture - текстура неба						*/
/* u_sample - Текстуры всего, u_sample_part - 										*/
/* u_seed1 и u_seed2 - Сиды случайных чисел											*/
/* MAX_DIST - Максимальная дистанция, light - направление источника света			*/
/************************************************************************************/

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_position;
uniform sampler2D u_skyTexture;
uniform sampler2D u_sample;
uniform float u_sample_part;
uniform vec2 u_seed1;
uniform vec2 u_seed2;
const float MAX_DIST = 9999.0;

const vec3 light = normalize(vec3(0.5, -1.2, -1.5));

uvec4 R_STATE;

/************************************************************************************/
/* Дальше идет блок функций рандома, их сделано несколько штук для генерации		*/
/* еще более случайных чисел														*/
/* Функции TausStep, LCGStep - простые функции рандома(возвращают одно значение),	*/
/* random - сложная функция рандома, использующая остальные две, и возвращающая 	*/
/* значение одного случайного числа.												*/
/************************************************************************************/

uint TausStep(uint z, int S1, int S2, int S3, uint M)
{
	uint b = (((z << S1) ^ z) >> S2);
	return (((z & M) << S3) ^ b);	
}

uint LCGStep(uint z, uint A, uint C)
{
	return (A * z + C);	
}


float random()
{
	R_STATE.x = TausStep(R_STATE.x, 13, 19, 12, uint(4294967294));
	R_STATE.y = TausStep(R_STATE.y, 2, 25, 4, uint(4294967288));
	R_STATE.z = TausStep(R_STATE.z, 3, 11, 17, uint(4294967280));
	R_STATE.w = LCGStep(R_STATE.w, uint(1664525), uint(1013904223));
	return 2.3283064365387e-10 * float((R_STATE.x ^( R_STATE.y ^ (R_STATE.z ^ R_STATE.w))));
}

/************************************************************************************/
/* Функция создания шума															*/
/* На вход получает значение двумерного вектора р, на выходе возвращает двоичный    */
/* вектор, который и создает шум на картинке										*/
/************************************************************************************/

vec2 hash22(vec2 p)
{
	p += u_seed1.x;
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx+33.33);
	return fract((p3.xx+p3.yz)*p3.zy);
}

/************************************************************************************/
/* Функция генерации случайных точек на сфере										*/
/* На выходе генерирует координаты случайной точки, которая оказывается на сфере    */
/************************************************************************************/

vec3 randomOnSphere() {
	vec3 rand = vec3(random(), random(), random());
	float theta = rand.x * 2.0 * 3.14159265;
	float v = rand.y;
	float phi = acos(2.0 * v - 1.0);
	float r = pow(rand.z, 1.0 / 3.0);
	float x = r * sin(phi) * cos(theta);
	float y = r * sin(phi) * sin(theta);
	float z = r * cos(phi);
	return vec3(x, y, z);
}

/************************************************************************************/
/* Функция вычисления синуса и косинуса для расчета поворота мыши					*/
/* На вход приходит значение координаты направления камеры, на выход возвращается	*/
/* двумерная матрица значений cos, -sin, sin, cos									*/
/************************************************************************************/

mat2 rot(float a) {
	float s = sin(a);
	float c = cos(a);
	return mat2(c, -s, s, c);
}

/************************************************************************************/
/* Функция пересечения луча с коробкой												*/
/************************************************************************************/

vec2 boxIntersect(in vec3 ro, in vec3 rd, in vec3 rad, out vec3 oN)  {				
	vec3 m = 1.0 / rd;
	vec3 n = m * ro;
	vec3 k = abs(m) * rad;
	vec3 t1 = -n - k;
	vec3 t2 = -n + k;
	float tN = max(max(t1.x, t1.y), t1.z);
	float tF = min(min(t2.x, t2.y), t2.z);
	if(tN > tF || tF < 0.0) return vec2(-1.0);
	oN = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
	return vec2(tN, tF);
}
	
/************************************************************************************/
/* Функция пересечения луча с плоскостью											*/
/************************************************************************************/

float plaIntersect(in vec3 ro, in vec3 rd, in vec4 p) {								
	return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
}

/************************************************************************************/
/* Функция создания текстуры неба													*/
/* На вход принимается значение координат направления камеры						*/
/* Функций написано для двух случаев: когда есть текстура неба и когда ее нет		*/
/************************************************************************************/

vec3 Sky(vec3 rd) {
	vec2 uv = vec2(atan(rd.x, rd.y), asin(rd.z)*2.0);
	uv /= 3.1415;
	uv = uv * 0.5 + 0.5;
	vec3 color = texture(u_skyTexture, uv).rgb;
	vec3 sun = vec3(0.95, 0.9, 1.0);
	sun *= max(0.0, pow(dot(rd, light), 256.0));
	color *= max(0.0, dot(light, vec3(0.0, 0.0, -1.0)));
	return clamp(sun + color * 0.01, 0.0, 1.0);
}
/*vec3 Sky(vec3 rd) {
	vec3 col = vec3(0.3, 0.6, 1.0);
	vec3 sun = vec3(0.95, 0.9, 1.0);
	sun *= max(0.0, pow(dot(rd, light), 256.0));
	col *= max(0.0, dot(light, vec3(0.0, 0.0, -1.0)));
	return clamp(sun + col * 0.01, 0.0, 1.0);
}
*/


/************************************************************************************/
/* Функция пересечения луча со сферой												*/
/************************************************************************************/	
	
vec2 sphIntersect(in vec3 ro, in vec3 rd, float ra) { 								
	float b = dot(ro, rd);
	float c = dot(ro, ro) - ra * ra;
	float h = b * b - c;
	if(h < 0.0) return vec2(-1.0);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

/************************************************************************************/
/* Основная функция "бросания лучей"												*/
/* На вход принимает значения координаты камеры и направления луча					*/
/* Функция проверяет, пересекает ли луч заданную фигуру и в зависимости от этого    */
/* возвращает определенный цвет пикселя, который является четырехмерным вектором	*/
/************************************************************************************/

vec4 castRay(inout vec3 ro, inout vec3 rd) {											
	vec2 minIt = vec2(MAX_DIST);								
	vec2 it;
	vec3 n;
	vec4 color;
	
	/*******************************************************************/
	/* Блок содержащий создание фигур								   */
	/* В каждой функции создания указываются:						   */
	/* ...Pos - Позиция фигуры										   */
	/* ...Intersect(ro, rd, ra), где ra - размер фигуры				   */
	/* color(x,y,z,a) - цвет, где x,y,z - цветовая шкала rgb, а - тип  */
	/* поверхности фигуры: от 0 до 1 степень зеркальности, от 0 до -1  */ 
	/* прозрачная фигуры, -2 - источник света						   */
	/*******************************************************************/
	
	vec3 sphPos = vec3(0.0, -1.0, 0.0);
	it = sphIntersect(ro - sphPos, rd, 1.0);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		vec3 itPos = ro + rd * it.x;
		n = normalize(itPos - sphPos);
		color = vec4(1.0, 0.2, 0.1, 1.0);
	}
	
	sphPos = vec3(5.0, 5.0, 0.0);
	it = sphIntersect(ro - sphPos, rd, 1.0);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		vec3 itPos = ro + rd * it.x;
		n = normalize(itPos - sphPos);
		color = vec4(1.1, 1.1, 1.1, -1.1);
	}
	
	sphPos = vec3(5.0, -3.0, 0.0);
	it = sphIntersect(ro - sphPos, rd, 2.0);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		vec3 itPos = ro + rd * it.x;
		n = normalize(itPos - sphPos);
		color = vec4(0.3, 0.6, 0.1, 0.0);
	}
	sphPos = vec3(1.0, 6.0, 0.0);
	it = sphIntersect(ro - sphPos, rd, 2.0);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		vec3 itPos = ro + rd * it.x;
		n = normalize(itPos - sphPos);
		color = vec4(1.0, 1.0, 1.0, 0.5);
	}
	
	vec3 boxN;
	vec3 boxPos = vec3(0.0, 2.0, -0.01);
	it = boxIntersect(ro - boxPos, rd, vec3(1.0), boxN);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = boxN;
		color = vec4(0.4, 0.6, 0.8, 0.001);
	}
	
	boxPos = vec3(3.0, 2.0, -2.5);
	it = boxIntersect(ro - boxPos, rd, vec3(0.5), boxN);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = boxN;
		color = vec4(1.0, 1.0, 1.0, -2.0);
	}
	
	
	vec3 planeNorm = vec3(0.0, 0.0, -1.0);
	it = vec2(plaIntersect(ro, rd, vec4(planeNorm, 1.0)));
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = planeNorm;
		color = vec4(0.5, 0.25, 0.1, 0.01);
	}
	
	/*******************************************************************/
	/* Блок, отвечающий за расчет света для поверхностей  			   */
	/*******************************************************************/
	
	if (minIt.x == MAX_DIST) return vec4(Sky(rd),-2.0);		//Если луч не попадает в фигуру, то пиксель закрашивается в цвет неба
	if(color.a == -2.0) return color;						//Если четвертый параметр цвета фигуры -2, то пиксель закрашивается чисто в цвет фигуры, создавая источник света
	vec3 spec = reflect(rd, n);								//Создание отраженного света
	if(color.a < 0.0) {										//Если четвертый параметр цвета фигуры <0, то идет расчет луча, как будто он проходит через прозрачную поверхность
		float fresnel = 1.0 - abs(dot(-rd, n));
		if(random() - 0.1 < fresnel * fresnel) {
			rd = spec;
			return color;
		}
		ro += rd * (minIt.y + 0.001);
		rd = refract(rd, n, 1.0 / (1.0 - color.a));
		return color;
	}
	vec3 itPos = ro + rd * it.x;							//Расчет нормали фигуры
	vec3 rand = randomOnSphere();
	vec3 diff = normalize(rand * dot(rand, n));				//Создание диффузного света
	ro += rd * (minIt.x - 0.001);
	rd = mix(diff, spec, color.a);							//Изменение направления луча, в зависимости от диффузного света и четвертого параметра света
	return color;

}

/************************************************************************************/
/* Функция трассировки лучей														*/
/************************************************************************************/

vec3 RayTracing(in vec3 ro, in vec3 rd) {
	vec3 color = vec3(1.0);
	for(int i = 0; i < 8; i++){
		vec4 refCol = castRay(ro, rd);
		color *= refCol.rgb;
		if(refCol.a == -2.0) return color;
	}
	return vec3(0.0);
}

/************************************************************************************/
/* Блок основной функции															*/
/* Принимаются все значения переменных из основной программы, вызываются остальные	*/
/* функции. Цель данного блока - закрашивание цвета пикселя.						*/
/************************************************************************************/

void main() { 
	vec2 uv = (gl_TexCoord[0].xy - 0.5) * u_resolution / u_resolution.y; 	//Создание координат пикселей
	vec2 uvRes = hash22(uv + 1.0) * u_resolution + u_resolution;			//Создание четырех изначальных случайных чисел
	R_STATE.x = uint(u_seed1.x + uvRes.x);
	R_STATE.y = uint(u_seed1.y + uvRes.x);
	R_STATE.z = uint(u_seed2.x + uvRes.y);
	R_STATE.w = uint(u_seed2.y + uvRes.y);
	vec3 rayOrigin = u_position; 											//Создание переменной позиции камеры		
	vec3 rayDirection = normalize(vec3(1.0, uv));							//Создание переменной координат направления камеры		
	rayDirection.zx *= rot(-u_mouse.y);										//Движение мышью в плоскость zx
	rayDirection.xy *= rot(u_mouse.x);										//Движение мышью в плоскости xy
	
	vec3 color = vec3(0.0);													//Создание переменной цвета пикселя
	int samples = 10;														//Максимальное количество сглаживания изображения
	for(int i = 0; i < samples; i++) {
		color += RayTracing(rayOrigin, rayDirection);						//Цвет становится более "правильным" при большем количестве 
	}
	color /= samples;
	
	float white = 20.0;														//Создание тонмапинга(корректировка света для более реалистичного изображения
	color *= white * 16.0;
	color = (color * (1.0 + color / white / white)) / (1.0 + color);
	
	vec3 sampleCol = texture(u_sample, gl_TexCoord[0].xy).rgb;
	color = mix(sampleCol, color, u_sample_part);
	gl_FragColor = vec4(color, 1.0);										//Закрашивание пикселя в определенный цвет
}