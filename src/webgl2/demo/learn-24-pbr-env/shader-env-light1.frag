#version 300 es
precision mediump float;
out vec4 FragColor;
in vec4 vLocPosition;

uniform sampler2D envTex;

const float PI = 3.14159265359;

vec2 getSphereUV(vec3 v) {
    vec2 invAtan = vec2(1.0 / (PI * 2.0), -1.0 / PI);
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan; 
    uv += 0.5;
    return uv;
}


vec3 getPositionColor(vec3 nor) {
  vec2 uv = getSphereUV(nor);
  return texture(envTex, uv).rgb;
}




void main()
{		
	// The world vector acts as the normal of a tangent surface
    // from the origin, aligned to vLocPosition. Given this normal, calculate all
    // incoming radiance of the environment. The result of this radiance
    // is the radiance of light coming from -Normal direction, which is what
    // we use in the PBR shader to sample irradiance.
    vec3 N = normalize(vLocPosition.xyz / vLocPosition.w);

    vec3 irradiance = vec3(0.0);   
    
    // tangent space calculation from origin point
    vec3 up    = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, N));
    up         = normalize(cross(N, right));
       
    float sampleDelta = 0.025;
    float nrSamples = 0.0;
    for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta)
    {
        for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta)
        {
            // spherical to cartesian (in tangent space)
            vec3 tangentSample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));
            // tangent space to world
            vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * N; 

            irradiance += getPositionColor(normalize(sampleVec)) * cos(theta) * sin(theta);
            nrSamples++;
        }
    }
    irradiance = PI * irradiance * (1.0 / float(nrSamples));
    
    FragColor = vec4(irradiance, 1.0);
}