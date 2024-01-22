uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_position;
const float MAX_DIST = 9999.0;

vec3 light = normalize(vec3(-0.7, 0.8, -1.0));

mat2 rot(float a) {
	float s = sin(a);
	float c = cos(a);
	return mat2(c, -s, s, c);
}

vec2 boxIntersect(in vec3 ro, in vec3 rd, in vec3 rad, out vec3 oN)  {		// Функция пересечения луча с параллелепипедом
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
	
float plaIntersect(in vec3 ro, in vec3 rd, in vec4 p) {						// Функция пересечения луча с плоскостью
	return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
}

vec3 Sky(vec3 rd) {
	vec3 color = vec3(0.3, 0.6, 1.0);
	vec3 sun = vec3(0.95, 0.9, 1.0);
	sun *= max(0.0, pow(dot(rd, light), 128.0));
	return clamp(sun + color , 0.0, 1.0);
}
	
	
vec2 sphIntersect(in vec3 ro, in vec3 rd, float ra) { 						// Функция пересечения луча со сферой
	float b = dot(ro, rd);
	float c = dot(ro, ro) - ra * ra;
	float h = b * b - c;
	if(h < 0.0) return vec2(-1.0);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

vec3 castRay(vec3 ro, vec3 rd) {											//Функция выделения цвета
	vec2 minIt = vec2(MAX_DIST);
	vec2 it;
	vec3 n;
	vec3 color;
	vec3 sphPos = vec3(0.0, -1.0, 0.0);
	it = sphIntersect(ro-sphPos, rd, 1.0);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		vec3 itPos = ro + rd * it.x;
		n = itPos - sphPos;
		color = vec3(1.0, 0.2, 0.1);
	}
	vec3 boxN;
	vec3 boxPos = vec3(0.0, 5.0, 0.0);
	it = boxIntersect(ro - boxPos, rd, vec3(1.0), boxN);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = boxN;
		color = vec3(0.6, 0.4, 1.0);
	}
	vec3 planeNorm = vec3(0.0, 0.0, -1.0);
	it = plaIntersect(ro, rd, vec4(planeNorm, 1.0));
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = planeNorm;
		color = vec3(0.5);
	}
	if (minIt.x == MAX_DIST) return vec4(Sky(rd), -2.0);
	float diffuse = max(0.0, dot(light, n))*0.5 + 0.1;
	float specular = max(0.0, pow(dot(reflect(rd,n), light), 32.0));
	color *= mix(diffuse, specular, 0.5);
	return color;

}

void main() { 
	vec2 uv = (gl_TexCoord[0].xy - 0.5) * u_resolution / u_resolution.y;	//Координата пикселя
	vec3 rayOrigin = u_position; 											//Координата камеры
	vec3 rayDirection = normalize(vec3(1.0, uv));							//Направление просмотра камеры
	rayDirection.zx *= rot(-u_mouse.y);
	rayDirection.xy *= rot(u_mouse.x);
	vec3 color = castRay(rayOrigin, rayDirection);
	color.r = pow(color.r, 0.45);
	color.g = pow(color.g, 0.45);
	color.b = pow(color.b, 0.45);
	gl_FragColor = vec4(color, 1.0);
}