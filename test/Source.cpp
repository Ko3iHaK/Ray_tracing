/* figure: 	Course work															 */
/*********************************************************************************/
/* Filename: Source.cpp                        								     */
/* Abstract: This is a sample c++ -program         								 */
/* Description:                                 								 */
/* Create date: 2022 / 06 / 05                 									 */
/* Author: Alekseev Maxim														 */
/* Notes/Platform/Copyright: NGTU/OS Windows(Ubuntu)							 */
/*********************************************************************************/
#include <SFML/Graphics.hpp>
#include <random>
#include <iostream>

int main()
{	/******************************************************************************/
	/* Блок объявления глобальных переменных									  */
	/* Объяснение каждой переменной:										      */
	/* x, y - Размеры окна приложения;											  */
	/* mouseX, mouseY - Координаты направления камеры							  */
	/* mouseH - Переменная, типа bool, которая запоминает, спрятан ли курсор мыши */
	/* framesStill -															  */
	/* mouseSens - значение чувствительности мыши								  */
	/* cameraMove - Массив клавишь для управления камерой						  */
	/* pos - Изначальная позиция камеры по x, y, z								  */
	/* rd, e2, dist - Случайные числа, сгенерированные с помощью библиотеки random*/
	/******************************************************************************/

	int x = 1920;
	int y = 1080;
	bool mouseH = true; 
	int mouseX = 1100; 
	int mouseY = 660;
	int framesStill = 1;
	float mouseSens = 3.0f; 
	bool cameraMove[6] = { false, false, false, false, false, false }; 
	sf::Vector3f pos = sf::Vector3f(-7.0f, 0.0f, -3.0f);
	std::random_device rd;
	std::mt19937 e2(rd());
	std::uniform_real_distribution<> dist(0.0f, 1.0f);

	sf::Shader shader;
	shader.loadFromFile("userint.frag", sf::Shader::Fragment);

	/*****************************************************************************/
	/* Блок создания пользовательского интерфейса								 */
	/* Предлагается ввести количество фигур, а также их параметры				 */
	/* После загрузка данных в шейдер											 */
	/*****************************************************************************/
	int nSph;
	float xSph, ySph, zSph, wSph;
	float rColSph, gColSph, bColSph, matSph;
	std::cout << "Enter a cout of spheres\n";
	while (true) {
		std::cin >> nSph;
		if (nSph < 0) {
			std::cout << "It must be a positive number\n";
		}
		else break;
	}
	std::cout << "Enter position and size of spheres\n";
	for (int i = 0; i < nSph; i++) {
		std::cout << "Enter x position\n";
		std::cin >> xSph;
		std::cout << "Enter y position\n";
		std::cin >> ySph;
		std::cout << "Enter z position\n";
		std::cin >> zSph;
		std::cout << "Enter size\n";
		std::cin >> wSph;
		if (wSph < 0) {
			std::cout << " Size must be a positive number\n";
		}
		sf::Vector3f physSph(xSph, ySph, zSph);
		//shader.setUniform("SphPos", physSph);
	}
	std::cout << "Enter a color of spheres\n";
	for (int i = 0; i < nSph; i++) {
		std::cout << "Enter a red color\n";
		std::cin >> rColSph;
		std::cout << "Enter a green color\n";
		std::cin >> gColSph;
		std::cout << "Enter a blue color\n";
		std::cin >> bColSph;
		std::cout << "Enter a material\n";
		std::cin >> matSph;
		sf::Glsl::Vec4 colSph(rColSph, gColSph, bColSph, matSph);
		//shader.setUniformArray("colSph", colSph*, 4);
	}
	
	int nBox;
	float xBox, yBox, zBox, wBox;
	float rColBox, gColBox, bColBox, matBox;
	std::cout << "Enter a cout of boxes\n";
	while (true) {
		std::cin >> nBox;
		if (nBox < 0) {
			std::cout << "It must be a positive number\n";
		}
		else break;
	}
	std::cout << "Enter position and size of boxes\n";
	for (int i = 0; i < nBox; i++) {
		std::cout << "Enter x position\n";
		std::cin >> xBox;
		std::cout << "Enter y position\n";
		std::cin >> yBox;
		std::cout << "Enter z position\n";
		std::cin >> zBox;
		std::cout << "Enter size\n";
		std::cin >> wBox;
		if (wBox < 0) {
			std::cout << " Size must be a positive number\n";
		}
		sf::Vector3f physBox(xBox, yBox, zBox);
		//shader.setUniform("SphPos", physSph);
	}
	std::cout << "Enter a color of boxes\n";
	for (int i = 0; i < nBox; i++) {
		std::cout << "Enter a red color\n";
		std::cin >> rColBox;
		std::cout << "Enter a green color\n";
		std::cin >> gColBox;
		std::cout << "Enter a blue color\n";
		std::cin >> bColBox;
		std::cout << "Enter a material\n";
		std::cin >> matBox;
		sf::Glsl::Vec4 colBox(rColBox, gColBox, bColBox, matBox);
		//shader.setUniformArray("colSph", colSph*, 4);
	}



	/******************************************************************************/
	/* Блок содержащий настройку окна приложения								  */	
	/* Функция RenderWindow создает окно с параметрами (Размер окна, название	  */
	/* окна, стили)																  */
	/* setFramerateLimit - Функция установления количества кадров в секунду		  */
	/* setMouseCursorVisible - Функция, которая делает курсор видимым или нет     */
	/******************************************************************************/

	sf::RenderWindow window(sf::VideoMode(x, y), "Ray tracing", sf::Style::Titlebar | sf::Style::Close); 
	window.setFramerateLimit(60);
	window.setMouseCursorVisible(false);
	
	/******************************************************************************/
	/* Блок содержащий создание текстур для шейдера								  */	
	/******************************************************************************/

	sf::RenderTexture firstTexture;
	firstTexture.create(x, y);
	sf::Sprite firstTextureSprite = sf::Sprite(firstTexture.getTexture());
	sf::Sprite firstTextureSpriteFlipped = sf::Sprite(firstTexture.getTexture());
	firstTextureSpriteFlipped.setScale(1, -1);
	firstTextureSpriteFlipped.setPosition(0, y);

	sf::RenderTexture outputTexture;
	outputTexture.create(x, y);
	sf::Sprite outputTextureSprite = sf::Sprite(outputTexture.getTexture());
	sf::Sprite outputTextureSpriteFlipped = sf::Sprite(firstTexture.getTexture());
	outputTextureSpriteFlipped.setScale(1, -1);
	outputTextureSpriteFlipped.setPosition(0, y);
	sf::Texture skyTexture; 
	skyTexture.loadFromFile("image.jpg");
	

	/******************************************************************************/
	/* Блок содержащий создание шейдера с помощью библиотеки sfml				  */
	/* Shader - Создание шейдера и loadFromFile - загрузка его из данного файла   */
	/* setUniform - Ввод переменных в шейдер (Размер экрана и текстура неба)      */
	/******************************************************************************/

	/*sf::Shader shader;
	shader.loadFromFile("present.frag", sf::Shader::Fragment); */
	shader.setUniform("u_resolution", sf::Vector2f(x, y)); 
	shader.setUniform("u_skyTexture", skyTexture);



	/******************************************************************************/
	/* Главный цикл, который работает , пока окно остается открытым				  */
	/******************************************************************************/

	while (window.isOpen()) {
		/**********************************************************************************/
		/* Блок проверки событий окна, которые были запущены с предыдущей итерации цикла  */
		/**********************************************************************************/
		sf::Event event; 
		while (window.pollEvent(event))
		{
			/******************************************************************************/
			/* Проверки событий:														  */
			/* Closed - Закрытие окна, MouseMoved - Движение мышки, 					  */
			/* MouseButtonPressed - нажатие клавиши мыши, KeyPressed - нажатие клавиши    */
			/* клавиатуры, KeyReleased - отпускание клавиши клавиатуры					  */
			/******************************************************************************/

			if (event.type == sf::Event::Closed) { 
				window.close();															   // Закрытие окна
			}
			else if (event.type == sf::Event::MouseMoved) { 
				if (mouseH) { 
					float mx = event.mouseMove.x - x / 2;								   // Неизмененные координаты мыши для проверки
					float my = event.mouseMove.y - y / 2;										
					mouseX += mx; 
					mouseY += my; 
					sf::Mouse::setPosition(sf::Vector2i(x / 2, y / 2), window);			   // Курсор мыши оставляется всегда в центре экрана
					if (mx != 0 || my != 0) framesStill = 1;							   // Проверка условия, что мышь не двигается
				}
			}
			else if (event.type == sf::Event::MouseButtonPressed) { 
				if (!mouseH) framesStill = 1;
				window.setMouseCursorVisible(false);									   // Курсор мыши снова становится виден
				mouseH = true;
			}
			else if (event.type == sf::Event::KeyPressed) { 
				if (event.key.code == sf::Keyboard::Escape) {							   // Если нажимается клавиша ESC, то нажимается "пауза", курсор становится виден, а новые обновления экрана не происходят
					window.setMouseCursorVisible(true);
					mouseH = false;
				}

				/******************************************************************************/
				/* Проверка условий, что клавиши клавиатуры нажаты							  */
				/******************************************************************************/

				else if (event.key.code == sf::Keyboard::W) cameraMove[0] = true;		
				else if (event.key.code == sf::Keyboard::A) cameraMove[1] = true;
				else if (event.key.code == sf::Keyboard::S) cameraMove[2] = true;
				else if (event.key.code == sf::Keyboard::D) cameraMove[3] = true;
				else if (event.key.code == sf::Keyboard::Space) cameraMove[4] = true;
				else if (event.key.code == sf::Keyboard::C) cameraMove[5] = true;
			}
			else if (event.type == sf::Event::KeyReleased)
			{
				/******************************************************************************/
				/* Проверка условий, что клавиши клавиатуры отжаты							  */
				/******************************************************************************/

				if (event.key.code == sf::Keyboard::W) cameraMove[0] = false;		
				else if (event.key.code == sf::Keyboard::A) cameraMove[1] = false;
				else if (event.key.code == sf::Keyboard::S) cameraMove[2] = false;
				else if (event.key.code == sf::Keyboard::D) cameraMove[3] = false;
				else if (event.key.code == sf::Keyboard::Space) cameraMove[4] = false;
				else if (event.key.code == sf::Keyboard::C) cameraMove[5] = false;
			}
		}

		/*************************************************************************************/
		/* Блок, который выполняется, если курсор мыши спрятан, то есть	когда "пауза" отжата */
		/*************************************************************************************/

		if (mouseH) { 
			float mx = ((float)mouseX / x - 0.5f) * mouseSens;									// К переменной координаты направления прибаляются значения, для ее изменения
			float my = ((float)mouseY / y - 0.5f) * mouseSens; 
			sf::Vector3f dir = sf::Vector3f(0.0f, 0.0f, 0.0f);
			sf::Vector3f dirTemp;																// Вектор направления камеры

			/*************************************************************************************/
			/* Проверка на нажатие клавишь, и сдвиг позиции камеры								 */
			/*************************************************************************************/

			if (cameraMove[0]) dir = sf::Vector3f(1.0f, 0.0f, 0.0f);
			else if (cameraMove[2]) dir = sf::Vector3f(-1.0f, 0.0f, 0.0f);
			if (cameraMove[1]) dir += sf::Vector3f(0.0f, -1.0f, 0.0f);
			else if (cameraMove[3]) dir += sf::Vector3f(0.0f, 1.0f, 0.0f);

			/*************************************************************************************/
			/* Блок, содержащий исправление движения камеры, чтобы та двигалась не по осям,		 */
			/* а относительно направлений, куда смотрит камера									 */
			/*************************************************************************************/

			dirTemp.z = dir.z * cos(-my) - dir.x * sin(-my); 
			dirTemp.x = dir.z * sin(-my) + dir.x * cos(-my); 
			dirTemp.y = dir.y;
			dir.x = dirTemp.x * cos(mx) - dirTemp.y * sin(mx);
			dir.y = dirTemp.x * sin(mx) + dirTemp.y * cos(mx);
			dir.z = dirTemp.z;
			pos += dir * 0.1f;

			/*************************************************************************************/
			/* Сдвиг позиции камеры вверх и вниз												 */
			/*************************************************************************************/

			if (cameraMove[4]) pos.z -= 0.1;
			else if (cameraMove[5]) pos.z += 0.1;


			for (int i = 0; i <= 5; i++) {
				if (cameraMove[i]) {
					framesStill = 1;
					break;
				}
			}

			/*************************************************************************************/
			/* Загрузка в шейдер переменных:													 */
			/* u_position - Позиция камеры,		u_mouse - Направление камеры					 */
			/* u_seed1 и u_seed2 - Сиды случайных чисел											 */
			/* u_sample_part -																	 */
			/*************************************************************************************/

			shader.setUniform("u_position", pos);
			shader.setUniform("u_mouse", sf::Vector2f(mx, my)); 
			shader.setUniform("u_seed1", sf::Vector2f((float)dist(e2), (float)dist(e2)) * 999.0f);
			shader.setUniform("u_seed2", sf::Vector2f((float)dist(e2), (float)dist(e2)) * 999.0f);
			shader.setUniform("u_sample_part", 1.0f / framesStill);
			
		}

		/*************************************************************************************/
		/* Блок рисования текстур															 */
		/* draw - рисует текстуру вытащенную из шейдера в другую текстуру или в окно         */
		/* framesStill - счетчик каждого кадра, если происхожит рендеринг					 */
		/*************************************************************************************/

		if (framesStill % 2 == 1)
		{
			shader.setUniform("u_sample", firstTexture.getTexture());
			outputTexture.draw(firstTextureSpriteFlipped, &shader);
			window.draw(outputTextureSprite);
		}
		else
		{
			shader.setUniform("u_sample", outputTexture.getTexture());
			firstTexture.draw(outputTextureSpriteFlipped, &shader);
			window.draw(firstTextureSprite);
		}
		window.display();									
		framesStill++;
	}
	return 0; 
}