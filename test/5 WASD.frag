uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_position;
const float MAX_DIST = 9999.0;

mat2 rot(float a) {
	float s = sin(a);
	float c = cos(a);
	return mat2(c, -s, s, c);
}

vec2 boxIntersect(in vec3 ro, in vec3 rd, in vec3 rad, out vec3 oN)  {		// ������� ����������� ���� � ����������������
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
	
float plaIntersect(in vec3 ro, in vec3 rd, in vec4 p) {						// ������� ����������� ���� � ����������
	return -(dot(ro, p.xyz) + p.w) / dot(rd, p.xyz);
}
	
	
	
vec2 sphIntersect(in vec3 ro, in vec3 rd, float ra) { 						// ������� ����������� ���� �� ������
	float b = dot(ro, rd);
	float c = dot(ro, ro) - ra * ra;
	float h = b * b - c;
	if(h < 0.0) return vec2(-1.0);
	h = sqrt(h);
	return vec2(-b - h, -b + h);
}

vec3 castRay(vec3 ro, vec3 rd) {											//������� ��������� �����
	vec2 minIt = vec2(MAX_DIST);
	vec2 it;
	vec3 n;
	vec3 sphPos = vec3(0.0, -1.0, 0.0);
	it = sphIntersect(ro-sphPos, rd, 1.0);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		vec3 itPos = ro + rd * it.x;
		n = itPos - sphPos;
	}
	vec3 boxN;
	vec3 boxPos = vec3(0.0, 2.0, 0.0);
	it = boxIntersect(ro - boxPos, rd, vec3(1.0), boxN);
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = boxN;
	}
	vec3 planeNorm = vec3(0.0, 0.0, 1.0);
	it = plaIntersect(ro, rd, vec4(planeNorm, 1.0));
	if(it.x > 0.0 && it.x < minIt.x){
		minIt = it;
		n = planeNorm;
	}
	if (minIt.x == MAX_DIST) return vec3(0.0);
	vec3 light = normalize(vec3(sin(u_time), 0.8, cos(u_time)));
	float diffuse = max(0.0, dot(light, n))*0.5 + 0.1;
	float specular = max(0.0, pow(dot(reflect(rd,n), light), 30.0));
	return diffuse + specular;

}

void main() { 
	vec2 uv = (gl_TexCoord[0].xy - 0.5) * u_resolution / u_resolution.y;	//���������� �������
	vec3 rayOrigin = u_position; 											//���������� ������
	vec3 rayDirection = normalize(vec3(1.0, uv));							//����������� ��������� ������
	rayDirection.zx *= rot(-u_mouse.y);
	rayDirection.xy *= rot(u_mouse.x);
	vec3 col = castRay(rayOrigin, rayDirection);
	gl_FragColor = vec4(col, 1.0);
}