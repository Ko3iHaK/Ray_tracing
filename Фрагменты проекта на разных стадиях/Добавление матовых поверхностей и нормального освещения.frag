#extension GL_EXT_gpu_shader4 : enable

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

uint TausStep(uint z, int S1, int S2, int S3, uint M)
{
	uint b = (((z << S1) ^ z) >> S2);
	return (((z & M) << S3) ^ b);	
}

uint LCGStep(uint z, uint A, uint C)
{
	return (A * z + C);	
}

vec2 hash22(vec2 p)
{
	p += u_seed1.x;
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx+33.33);
	return fract((p3.xx+p3.yz)*p3.zy);
}

float random()
{
	R_STATE.x = TausStep(R_STATE.x, 13, 19, 12, uint(4294967294));
	R_STATE.y = TausStep(R_STATE.y, 2, 25, 4, uint(4294967288));
	R_STATE.z = TausStep(R_STATE.z, 3, 11, 17, uint(4294967280));
	R_STATE.w = LCGStep(R_STATE.w, uint(1664525), uint(1013904223));
	return 2.3283064365387e-10 * float((R_STATE.x ^( R_STATE.y ^ (R_STATE.z ^ R_STATE.w))));
}

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
	vec2 uv = vec2(atan(rd.x, rd.y), asin(rd.z)*2.0);
	uv /= 3.1415;
	uv = uv * 0.5 + 0.5;
	vec3 color = texture(u_skyTexture, uv).rgb;
	vec3 sun = vec3(0.95, 0.9, 1.0);
	sun *= max(0.0, pow(dot(rd, light), 128.0));
	return clamp(sun + color * 0.5, 0.0, 1.0);
}
	
	
vec2 sphIntersect(in vec3 ro, in vec3 rd, float ra) { 						// Функция пересечения луча со сферой
	float b = dot(ro, rd);
	float c = dot(ro, ro) - ra * ra;
	float h = b * b - c;
	if(h < 0.0) return vec2(-1.0);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

vec3 castRay(inout vec3 ro, inout vec3 rd) {											//Функция выделения цвета
	vec2 minIt = vec2(MAX_DIST);
	vec2 it;
	vec3 n;
	vec4 color;
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
		color = vec4(1.0, 1.0, 1.0, 0.0);
	}
	
	
	vec3 boxN;
	vec3 boxPos = vec3(0.0, 2.0, 0.0);
	it = boxIntersect(ro - boxPos, rd, vec3(1.0), boxN);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = boxN;
		color = vec4(0.4, 0.6, 0.8, 0.0);
	}
	
	vec3 planeNorm = vec3(0.0, 0.0, -1.0);
	it = plaIntersect(ro, rd, vec4(planeNorm, 1.0));
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = planeNorm;
		color = vec4(1.0, 0.7, 0.5, 0.001);
	}
	if (minIt.x == MAX_DIST) return vec3(-2.0);
	vec3 spec = reflect(rd, n);
	if (color.a < 0.0) {
		ro += rd *(minIt.y + 0.001);
		rd = refract(rd, n, 1.0 / (1.0 - color.a));
		return color;
	}
	vec3 itPos = ro + rd * it.x;
	vec3 rand = randomOnSphere();
	vec3 diff = normalize(rand * dot(rand, n));
	ro += rd * (minIt.x - 0.001);
	rd = mix(diff, spec, color.a);
	return color;

}

vec3 RayTracing(in vec3 ro, in vec3 rd) {
	vec3 color = vec3(1.0);
	for(int i = 0; i < 8; i++){
		vec3 second = castRay(ro, rd);
		if(second.x == -2.0){
			return color * Sky(rd);
		}
		color *= second;
	}
	return vec3(0.0);
}


void main() { 
	vec2 uv = (gl_TexCoord[0].xy - 0.5) * u_resolution / u_resolution.y;	//Координата пикселя
	vec2 uvRes = hash22(uv + 1.0) * u_resolution + u_resolution;
	R_STATE.x = uint(u_seed1.x + uvRes.x);
	R_STATE.y = uint(u_seed1.y + uvRes.x);
	R_STATE.z = uint(u_seed2.x + uvRes.y);
	R_STATE.w = uint(u_seed2.y + uvRes.y);
	vec3 rayOrigin = u_position; 											//Координата камеры
	vec3 rayDirection = normalize(vec3(1.0, uv));							//Направление просмотра камеры
	rayDirection.zx *= rot(-u_mouse.y);
	rayDirection.xy *= rot(u_mouse.x);
	
	vec3 color = vec3(0.0);
	int samples = 10;
	for(int i = 0; i < samples; i++) {
		color += RayTracing(rayOrigin, rayDirection);
	}
	color /= samples;
	vec3 sampleCol = texture(u_sample, gl_TexCoord[0].xy).rgb;
	color = mix(sampleCol, color, u_sample_part);
	gl_FragColor = vec4(color, 1.0);
}